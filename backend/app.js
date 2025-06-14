const express = require("express");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb", verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 5000;

// File mapping for each round
const ROUND_FILES = {
  "Round 1": "Final_Data.csv",
  "Round 2": "Final_data_second_round.csv",
  "Round 3": "Final_data_Third_Round.csv"
};
const roundRecords = { "Round 1": [], "Round 2": [], "Round 3": [] };
for (const [round, file] of Object.entries(ROUND_FILES)) {
  roundRecords[round] = [];
  if (fs.existsSync(file)) {
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => roundRecords[round].push(row))
      .on("end", () => console.log(`CSV Loaded for ${round}:`, roundRecords[round].length, "rows"));
  } else {
    console.log(`File not found: ${file}, ${round} will be empty.`);
  }
}

function norm(str) {
  return (str || "").trim().toLowerCase();
}

// Razorpay config (use your actual keys)
const razorpay = new Razorpay({
  key_id: "rzp_live_YoU8Mex88gOhS9",
  key_secret: "CE0e3X6F3VtRQN6TRb8rD68Y",
});
const paidOrders = new Set();
const RAZORPAY_WEBHOOK_SECRET = "ravi123";

// Razorpay webhook
app.post("/api/razorpay-webhook", (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");
  if (signature !== expectedSignature) {
    console.log("Invalid webhook signature", signature, expectedSignature);
    return res.status(400).send("Invalid signature");
  }
  const event = req.body.event;
  if (event === "payment.captured" || event === "order.paid") {
    const orderId = (req.body.payload && req.body.payload.payment && req.body.payload.payment.entity && req.body.payload.payment.entity.order_id)
      || (req.body.payload && req.body.payload.order && req.body.payload.order.entity && req.body.payload.order.entity.id);
    if (orderId) {
      paidOrders.add(orderId);
      console.log(`[Webhook] Order PAID: ${orderId}`);
    }
  }
  res.json({ status: "ok" });
});

// Payment status
app.get("/api/payment-status", async (req, res) => {
  const { order_id } = req.query;
  if (!order_id) return res.json({ paid: false });
  if (paidOrders.has(order_id)) return res.json({ paid: true });
  try {
    const order = await razorpay.orders.fetch(order_id);
    if (order.status === "paid") {
      paidOrders.add(order_id);
      return res.json({ paid: true });
    }
  } catch (e) {
    console.log("Error fetching order:", e);
  }
  res.json({ paid: false });
});

// Dropdown options, by round
app.get("/api/options", (req, res) => {
  const round = req.query.round || "Round 1";
  console.log("[OPTIONS] Requested round:", round);
  const records = roundRecords[round] || [];
  const courses = [...new Set(records.map(r => (r.course || "").trim()))].filter(Boolean).sort();
  const categories = [...new Set(records.map(r => (r.category || "").trim()))].filter(Boolean).sort();
  res.json({ courses, categories });
});

// Predict eligible count (per round)
app.post("/api/predict", (req, res) => {
  let { course, category, rank, round } = req.body;
  round = round || "Round 1";
  const records = roundRecords[round] || [];
  if (!course || !category || !rank) return res.status(400).json({ error: "Missing params" });
  const result = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      parseInt(rank) <= parseInt(r.cutoff_rank)
  );
  res.json({ eligibleCount: result.length, locked: true });
});

// Razorpay order
app.post("/api/create-order", async (req, res) => {
  const { amount } = req.body;
  const payment_capture = 1;
  const currency = "INR";
  const options = {
    amount: amount * 100,
    currency,
    receipt: "order_rcptid_11",
    payment_capture
  };
  try {
    const response = await razorpay.orders.create(options);
    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).send(error);
  }
});

// Unlock after payment: grouped by branch (per round)
app.post("/api/unlock", (req, res) => {
  let { course, category, rank, order_id, round } = req.body;
  round = round || "Round 1";
  if (!paidOrders.has(order_id)) {
    return res.status(402).json({ error: "Payment not confirmed for this order." });
  }
  const userRank = parseInt(rank);
  const records = roundRecords[round] || [];
  const eligible = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      userRank <= parseInt(r.cutoff_rank)
  );
  const grouped = {};
  eligible.forEach(row => {
    const branch = row.branch || "Other";
    if (!grouped[branch]) grouped[branch] = [];
    grouped[branch].push(row);
  });
  for (const branch in grouped) {
    grouped[branch].sort((a, b) => parseInt(a.cutoff_rank) - parseInt(b.cutoff_rank));
  }
  res.json({ groupedEligible: grouped });
});

// PDF report (per round, but client must send groupedEligible)
app.post("/api/generate-pdf", (req, res) => {
  const { groupedEligible } = req.body;
  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="college_report.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text("CET College Predictor Report", { align: "center" });
  doc.moveDown();

  if (!groupedEligible || Object.keys(groupedEligible).length === 0) {
    doc.fontSize(13).fillColor("red").text("No eligible colleges found.");
  } else {
    for (const branchName of Object.keys(groupedEligible)) {
      doc.fontSize(15).fillColor("green").text(branchName, { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(12).fillColor("black");
      doc.text(
        [
          padCell("College Code", 15),
          padCell("College Name", 45),
          padCell("Course", 8),
          padCell("Category", 10),
          padCell("Cutoff Rank", 12),
        ].join(""),
        { continued: false }
      );
      doc.moveDown(0.1);
      doc.fontSize(11);
      doc.text("".padEnd(90, "-"), { continued: false });
      groupedEligible[branchName].forEach((col, idx) => {
        doc.text(
          [
            padCell(col.college_code, 15),
            padCell(col.college_name, 45),
            padCell(col.course, 8),
            padCell(col.category, 10),
            padCell(col.cutoff_rank, 12),
          ].join(""),
          { continued: false }
        );
      });
      doc.moveDown(1.2);
    }
  }
  doc.end();
});
function padCell(text, width) {
  text = String(text || "");
  if (text.length >= width) return text.slice(0, width - 2) + ".. ";
  return text + " ".repeat(width - text.length);
}

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
