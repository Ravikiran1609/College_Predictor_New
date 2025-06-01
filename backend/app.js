const express = require("express");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Load CSV into memory
let records = [];
fs.createReadStream("Final_Data.csv")
  .pipe(csv())
  .on("data", (row) => records.push(row))
  .on("end", () => console.log("CSV Loaded:", records.length, "rows"));

const razorpay = new Razorpay({
  key_id: "rzp_test_SmAPbhfUjKXBRl",   // <-- YOUR Razorpay TEST key here!
  key_secret: "R4EBI77YmgxKmHTkFmsVa9aN" // <-- YOUR Razorpay TEST secret here!
});

// API for dropdowns
app.get("/api/options", (req, res) => {
  const courses = [...new Set(records.map(r => r.course))].sort();
  const categories = [...new Set(records.map(r => r.category))].sort();
  const branches = [...new Set(records.map(r => r.branch))].sort();
  res.json({ courses, categories, branches });
});

// POST API to check number of eligible colleges
app.post("/api/predict", (req, res) => {
  const { course, category, branch, rank } = req.body;
  if (!course || !category || !rank) return res.status(400).json({ error: "Missing params" });
  const result = records.filter(
    (r) =>
      r.course.toLowerCase() === course.toLowerCase() &&
      r.category.toLowerCase() === category.toLowerCase() &&
      (!branch || r.branch === branch) &&
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

// POST API to unlock and return sorted data
app.post("/api/unlock", (req, res) => {
  const { course, category, branch, rank } = req.body;
  let result = records.filter(
    (r) =>
      r.course.toLowerCase() === course.toLowerCase() &&
      r.category.toLowerCase() === category.toLowerCase() &&
      (!branch || r.branch === branch) &&
      parseInt(rank) <= parseInt(r.cutoff_rank)
  );
  result = result.sort((a, b) => parseInt(a.cutoff_rank) - parseInt(b.cutoff_rank));
  res.json({ eligibleColleges: result });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

