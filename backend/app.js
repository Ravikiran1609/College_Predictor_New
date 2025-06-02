const express = require("express");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
// FIX: support up to 10mb POSTs
app.use(bodyParser.json({ limit: "10mb" }));
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
  key_id: "rzp_test_SmAPbhfUjKXBRl",
  key_secret: "R4EBI77YmgxKmHTkFmsVa9aN",
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
  const { course, category, rank } = req.body;
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

// ======= PDF REPORT ENDPOINT (Grouped By Branch) ======= //
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
      doc.fontSize(14).fillColor("green").text(branchName, { underline: true });
      groupedEligible[branchName].forEach((col, idx) => {
        doc.fontSize(11).fillColor("black").text(
          `${idx + 1}. ${col.college_name} (${col.college_code}) | Course: ${col.course} | Category: ${col.category} | Cutoff Rank: ${col.cutoff_rank}`
        );
      });
      doc.moveDown();
    }
  }
  doc.end();
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

