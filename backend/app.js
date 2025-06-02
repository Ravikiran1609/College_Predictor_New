const express = require("express");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Helper: normalized string
function norm(str) {
  return (str || "").trim().toLowerCase();
}

function branchMatch(rowBranch, userBranch) {
  if (!userBranch || userBranch.trim() === "") return true; // all branches
  return norm(rowBranch) === norm(userBranch);
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

// For dropdowns: always return the ACTUAL CSV values
app.get("/api/options", (req, res) => {
  const courses = [...new Set(records.map(r => (r.course || "").trim()))].filter(Boolean).sort();
  const categories = [...new Set(records.map(r => (r.category || "").trim()))].filter(Boolean).sort();
  const branches = [...new Set(records.map(r => (r.branch || "").trim()))].filter(Boolean).sort();
  res.json({ courses, categories, branches });
});

// Eligibility prediction
app.post("/api/predict", (req, res) => {
  const { course, category, branch, rank } = req.body;
  if (!course || !category || !rank) return res.status(400).json({ error: "Missing params" });

  const result = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      branchMatch(r.branch, branch) &&
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

// Main eligibility logic
app.post("/api/unlock", (req, res) => {
  const { course, category, branch, rank } = req.body;
  const userRank = parseInt(rank);

  // Eligible: userRank <= cutoff_rank
  let eligible = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      branchMatch(r.branch, branch) &&
      userRank <= parseInt(r.cutoff_rank)
  );
  eligible = eligible.sort((a, b) => parseInt(a.cutoff_rank) - parseInt(b.cutoff_rank));

  // Near miss: cutoff_rank < userRank && cutoff_rank >= userRank - 2000
  let nearMiss = records.filter(
    (r) =>
      norm(r.course) === norm(course) &&
      norm(r.category) === norm(category) &&
      branchMatch(r.branch, branch) &&
      parseInt(r.cutoff_rank) < userRank &&
      parseInt(r.cutoff_rank) >= userRank - 2000
  );
  nearMiss = nearMiss.filter(
    (r) => !eligible.some(e =>
      norm(e.college_code) === norm(r.college_code) &&
      norm(e.branch) === norm(r.branch) &&
      String(e.cutoff_rank) === String(r.cutoff_rank)
    )
  );
  nearMiss = nearMiss.sort((a, b) => parseInt(a.cutoff_rank) - parseInt(b.cutoff_rank));

  res.json({
    eligibleColleges: eligible,
    nearMissColleges: nearMiss,
  });
});

// ======= PDF REPORT ENDPOINT ======= //
app.post("/api/generate-pdf", (req, res) => {
  const { eligibleColleges, nearMissColleges } = req.body;
  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="college_report.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text("CET College Predictor Report", { align: "center" });
  doc.moveDown();

  // Eligible Colleges
  doc.fontSize(14).fillColor("green").text("Eligible Colleges:", { underline: true });
  doc.moveDown(0.5);

  if (eligibleColleges && eligibleColleges.length > 0) {
    eligibleColleges.forEach((col, idx) => {
      doc.fontSize(11).fillColor("black").text(
        `${idx + 1}. ${col.college_name} (${col.college_code}) | Branch: ${col.branch} | Course: ${col.course} | Category: ${col.category} | Cutoff Rank: ${col.cutoff_rank}`
      );
    });
  } else {
    doc.fontSize(11).fillColor("black").text("No eligible colleges found.");
  }

  doc.moveDown();

  // Near Miss Colleges
  doc.fontSize(14).fillColor("#cc205f").text("Near Miss Colleges (within 2000 ranks better):", { underline: true });
  doc.moveDown(0.5);

  if (nearMissColleges && nearMissColleges.length > 0) {
    nearMissColleges.forEach((col, idx) => {
      doc.fontSize(11).fillColor("black").text(
        `${idx + 1}. ${col.college_name} (${col.college_code}) | Branch: ${col.branch} | Course: ${col.course} | Category: ${col.category} | Cutoff Rank: ${col.cutoff_rank}`
      );
    });
  } else {
    doc.fontSize(11).fillColor("black").text("No near miss colleges.");
  }

  doc.end();
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

