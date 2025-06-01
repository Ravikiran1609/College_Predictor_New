import { useEffect, useState } from "react";

export default function Home() {
  const [course, setCourse] = useState("");
  const [category, setCategory] = useState("");
  const [branch, setBranch] = useState("");
  const [rank, setRank] = useState("");
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [locked, setLocked] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [eligibleColleges, setEligibleColleges] = useState([]);
  const [paid, setPaid] = useState(false);

  // For nginx proxy, apiURL can be empty
  const apiURL = "";

  useEffect(() => {
    fetch(`${apiURL}/api/options`)
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses);
        setCategories(data.categories);
        setBranches(data.branches);
      });
  }, []);

  const handlePredict = async () => {
    const res = await fetch(`${apiURL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, category, branch, rank }),
    });
    const data = await res.json();
    setEligibleCount(data.eligibleCount);
    setLocked(true);
  };

  const handlePayment = async () => {
    // Razorpay script loader (see previous messages for async loading)
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const res = await fetch(`${apiURL}/api/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10 }), // ₹10
    });
    const order = await res.json();

    const options = {
      key: "rzp_test_xxxxxxxx", // Your Razorpay key
      amount: order.amount,
      currency: order.currency,
      name: "CET College Predictor",
      description: "Access your eligible colleges list",
      order_id: order.id,
      handler: async function () {
        setPaid(true);
        const res2 = await fetch(`${apiURL}/api/unlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course, category, branch, rank }),
        });
        const data2 = await res2.json();
        setEligibleColleges(data2.eligibleColleges);
      },
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#0d9488" },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontWeight: "bold", fontSize: 42 }}>CET College Predictor</h1>
      <div>
        <label>
          Course:
          <select value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Category:
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Branch:
          <select value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Rank:
          <input value={rank} onChange={e => setRank(e.target.value)} />
        </label>
      </div>
      <br />
      <button onClick={handlePredict}>Find Eligible Colleges</button>
      {locked && !paid && (
        <div>
          <p>
            <b>{eligibleCount}</b> colleges found. <b>Pay ₹10</b> to unlock full list & download!
          </p>
          <button onClick={handlePayment}>Pay & Unlock</button>
        </div>
      )}
      {paid && (
        <div>
          <h2>Eligible Colleges</h2>
          <table border="1" cellPadding="4">
            <thead>
              <tr>
                <th>College Code</th>
                <th>College Name</th>
                <th>Branch</th>
                <th>Course</th>
                <th>Category</th>
                <th>Cutoff Rank</th>
              </tr>
            </thead>
            <tbody>
              {eligibleColleges.map((col, idx) => (
                <tr key={idx}>
                  <td>{col.college_code}</td>
                  <td>{col.college_name}</td>
                  <td>{col.branch}</td>
                  <td>{col.course}</td>
                  <td>{col.category}</td>
                  <td>{col.cutoff_rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Download CSV button */}
          <button onClick={() => {
            const csv = [
              Object.keys(eligibleColleges[0]).join(","),
              ...eligibleColleges.map(r => Object.values(r).join(",")),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "eligible_colleges.csv";
            link.click();
          }}>Download as CSV</button>
        </div>
      )}
    </main>
  );
}

