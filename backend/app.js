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

// --- Payment config (Add your Razorpay keys here) ---
const razorpay = new Razorpay({
  key_id: "rzp_test_xxxxxxxx",     // <--- Replace with your Razorpay TEST key
  key_secret: "xxxxxxxxxxxxxxxx"   // <--- Replace with your Razorpay TEST secret
});

// --- API to predict eligible colleges ---
app.post("/api/predict", (req, res) => {
  const { course, category, rank } = req.body;
  if (!course || !category || !rank) return res.status(400).json({ error: "Missing params" });

  const result = records.filter(
    (r) =>
      r.course.toLowerCase() === course.toLowerCase() &&
      r.category.toLowerCase() === category.toLowerCase() &&
      parseInt(rank) <= parseInt(r.cutoff_rank)
  );
  // Just return count and locked=true
  res.json({ eligibleCount: result.length, locked: true });
});

// --- Payment order creation ---
app.post("/api/create-order", async (req, res) => {
  const { amount } = req.body;
  const payment_capture = 1;
  const currency = "INR";

  const options = {
    amount: amount * 100, // amount in paisa
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
    res.status(500).send(error);
  }
});

// --- API to actually unlock data after payment (for demo, always unlock) ---
app.post("/api/unlock", (req, res) => {
  const { course, category, rank } = req.body;
  const result = records.filter(
    (r) =>
      r.course.toLowerCase() === course.toLowerCase() &&
      r.category.toLowerCase() === category.toLowerCase() &&
      parseInt(rank) <= parseInt(r.cutoff_rank)
  );
  res.json({ eligibleColleges: result });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

