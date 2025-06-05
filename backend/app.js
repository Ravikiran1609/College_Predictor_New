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

function norm(str) {
  return (str || "").trim().toLowerCase();
}

let records = [];
fs.createReadStream("Final_Data.csv")
  .pipe(csv())
  .on("data", (row) => records.push(row))
  .on("end", () => console.log("CSV Loaded:", records.length, "rows"));

// Razorpay config (use your actual keys)
const razorpay = new Razorpay({
  key_id: "rzp_live_YoU8Mex88gOhS9",
  key_secret: "CE0e3X6F3VtRQN6TRb8rD68Y",
});

// ======== PAID ORDERS TRACKING (in-memory Set, replace with DB in prod) ========
const paidOrders = new Set();

// WEBHOOK secret string (set this in Razorpay dashboard)
const RAZORPAY_WEBHOOK_SECRET = "Ravi@160995";

// Razorpay Webhook handler: Mark order as paid when payment.captured
app.post("/api/razorpay-webhook", (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");
  if (signature !== expectedSignature) {
    return res.status(400).send("Invalid signature");
  }
  const event = req.body.event;
  if (event === "payment.captured") {
    const orderId = req.body.payload.payment.entity.order_id;
    paidOrders.add(orderId);
    console.log(`[Webhook] Order PAID: ${orderId}`);
  }
  res.json({ status: "ok" });
});

// Check payment status by order_id (frontend should poll after payment)
app.get("/api/payment-status", (req, res) => {
  const { order_id } = req.query;
  if (!order_id) return res.json({ paid: false });
  res.json({ paid: paidOrders.has(order_id) });
});

// For dropdowns: always return ACTUAL CSV values
app.get("/api/options", (req, res) => {
  const courses = [...new Set(records.map(r => (r.course || "").trim()))].filter(Boolean).sort();
  const categories = [...new Set(records.map(r => (r.category || "").trim()))].filter(Boolean).sort();
  res.json({ courses, categories });
});

// Eligibility prediction (for count before unlock)
app.post("/api/predict", (req, res) => {
  const { course, category, rank } = req.body;
  if (!course || !category || !rank) return res.status(400).json({ error: "Missing params" });
  const result = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      parseInt(rank) <= parseInt(r.cutoff_rank)
  );
  res.json({ eligibleCount: result.length, locked: true });
});

// Razorpay order creation
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

// Unlock after payment: group eligible colleges by branch, ascending by cutoff_rank
app.post("/api/unlock", (req, res) => {
  const { course, category, rank, order_id } = req.body;
  if (!paidOrders.has(order_id)) {
    return res.status(402).json({ error: "Payment not confirmed for this order." });
  }
  const userRank = parseInt(rank);

  // Find all eligible records (no branch filter)
  const eligible = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      userRank <= parseInt(r.cutoff_rank)
  );

  // Group by branch, and sort each group by cutoff rank
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

// ======= PDF REPORT ENDPOINT (Grouped Table By Branch) ======= //
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
      // Branch header
      doc.fontSize(15).fillColor("green").text(branchName, { underline: true });
      doc.moveDown(0.2);

      // Table header
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

      // Divider line
      doc.text(
        "".padEnd(90, "-"),
        { continued: false }
      );

      // Table rows
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

// Helper function for "columnized" text output
function padCell(text, width) {
  text = String(text || "");
  if (text.length >= width) return text.slice(0, width - 2) + ".. ";
  return text + " ".repeat(width - text.length);
}

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

