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
      body: JSON.stringify({ amount: 10 }),
    });
    const order = await res.json();

    const options = {
      key: "rzp_test_SmAPbhfUjKXBRl", // <-- Your Razorpay test key
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
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-100 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-emerald-700 drop-shadow">CET College Predictor</h1>
        <form
          className="grid grid-cols-1 gap-4 mb-8"
          onSubmit={e => { e.preventDefault(); handlePredict(); }}
        >
          <label className="flex flex-col font-semibold">
            Course
            <select className="border rounded px-3 py-2 mt-1" value={course} onChange={e => setCourse(e.target.value)}>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col font-semibold">
            Category
            <select className="border rounded px-3 py-2 mt-1" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <label className="flex flex-col font-semibold">
            Branch
            <select className="border rounded px-3 py-2 mt-1" value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="flex flex-col font-semibold">
            Rank
            <input className="border rounded px-3 py-2 mt-1" value={rank} onChange={e => setRank(e.target.value)} />
          </label>
          <button
            type="submit"
            className="mt-2 py-2 px-6 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow transition"
          >
            Find Eligible Colleges
          </button>
        </form>
        {locked && !paid && (
          <div className="mb-8 text-center">
            <p className="mb-4 text-xl"><b>{eligibleCount}</b> colleges found. <b>Pay ₹10</b> to unlock full list & download!</p>
            <button onClick={handlePayment} className="py-2 px-6 rounded bg-indigo-600 hover:bg-indigo-800 text-white font-bold shadow transition">Pay & Unlock</button>
          </div>
        )}
        {paid && (
          <div>
            <h2 className="text-2xl font-bold mt-8 mb-4">Eligible Colleges</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm rounded-lg bg-white">
                <thead className="bg-emerald-100">
                  <tr>
                    <th className="border px-3 py-2">College Code</th>
                    <th className="border px-3 py-2">College Name</th>
                    <th className="border px-3 py-2">Branch</th>
                    <th className="border px-3 py-2">Course</th>
                    <th className="border px-3 py-2">Category</th>
                    <th className="border px-3 py-2">Cutoff Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleColleges.map((col, idx) => (
                    <tr key={idx}>
                      <td className="border px-3 py-1">{col.college_code}</td>
                      <td className="border px-3 py-1">{col.college_name}</td>
                      <td className="border px-3 py-1">{col.branch}</td>
                      <td className="border px-3 py-1">{col.course}</td>
                      <td className="border px-3 py-1">{col.category}</td>
                      <td className="border px-3 py-1">{col.cutoff_rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="mt-4 py-2 px-6 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow transition"
              onClick={() => {
                const csv = [
                  Object.keys(eligibleColleges[0]).join(","),
                  ...eligibleColleges.map(r => Object.values(r).join(",")),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "eligible_colleges.csv";
                link.click();
              }}>
              Download as CSV
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

