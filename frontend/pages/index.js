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
  const [formError, setFormError] = useState("");

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

  const validateForm = () => {
    if (!course || !category || !rank) {
      setFormError("Please select Course, Category, and enter Rank.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handlePredict = async () => {
    if (!validateForm()) return;

    setLocked(false);
    setPaid(false);
    setEligibleCount(0);
    setEligibleColleges([]);
    const res = await fetch(`${apiURL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, category, branch, rank }),
    });
    const data = await res.json();
    if (data.error) {
      setFormError(data.error);
      setLocked(false);
    } else {
      setEligibleCount(data.eligibleCount);
      setLocked(true);
      setFormError("");
    }
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
      theme: { color: "#4f46e5" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 to-pink-100 flex flex-col items-center py-12 px-2">
      {/* HEADER */}
      <div className="flex flex-col items-center mb-10 animate-fadein">
        <img src="https://cdn-icons-png.flaticon.com/512/4209/4209617.png" alt="Predictor" className="w-24 h-24 mb-2 drop-shadow-xl" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-700 mb-2 text-center drop-shadow-lg">CET College Predictor</h1>
        <p className="text-xl text-indigo-900 font-semibold mb-2">Find your best-fit colleges instantly!</p>
      </div>

      {/* GLASS CARD FORM */}
      <div className="w-full max-w-2xl mx-auto glass shadow-2xl rounded-3xl p-8">
        {/* NOTE */}
        <div className="mb-6 p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
          </svg>
          <span className="text-indigo-700 font-medium">
            Prediction is purely based on previous year cutoff. It may vary for present year.
          </span>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl bg-pink-100 text-pink-800 font-semibold px-4 py-2 border border-pink-300 shadow animate-fadein">
            {formError}
          </div>
        )}

        {/* FORM */}
        <form className="grid grid-cols-1 gap-5" onSubmit={e => { e.preventDefault(); handlePredict(); }}>
          <div>
            <label className="font-semibold text-indigo-700">Course</label>
            <select className="w-full border-2 border-indigo-200 rounded-xl px-4 py-2 mt-1 shadow transition focus:ring-2 focus:ring-indigo-300" value={course} onChange={e => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-indigo-700">Category</label>
            <select className="w-full border-2 border-indigo-200 rounded-xl px-4 py-2 mt-1 shadow transition focus:ring-2 focus:ring-indigo-300" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-indigo-700">Branch</label>
            <select className="w-full border-2 border-indigo-200 rounded-xl px-4 py-2 mt-1 shadow transition focus:ring-2 focus:ring-indigo-300" value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-indigo-700">Your Rank</label>
            <input type="number" min="1" className="w-full border-2 border-indigo-200 rounded-xl px-4 py-2 mt-1 shadow focus:ring-2 focus:ring-indigo-300" value={rank} onChange={e => setRank(e.target.value)} required />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition transform"
          >
            Find Eligible Colleges
          </button>
        </form>

        {/* LOCKED RESULT */}
        {locked && !paid && (
          <div className="flex flex-col items-center mt-8">
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-6 py-4 mb-3 text-pink-700 font-semibold shadow animate-fadein">
              <span className="text-3xl">{eligibleCount}</span> eligible college{eligibleCount !== 1 ? "s" : ""} found!
            </div>
            <button
              onClick={handlePayment}
              className="py-3 px-10 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition transform"
            >
              Pay ₹10 & Unlock Details
            </button>
            <p className="mt-2 text-xs text-indigo-400">One-time payment, unlock instantly!</p>
          </div>
        )}

        {/* UNLOCKED RESULT */}
        {paid && eligibleColleges.length > 0 && (
          <div className="mt-8 animate-fadein">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Eligible Colleges List</h2>
            <div className="overflow-x-auto rounded-2xl border border-indigo-200 bg-white shadow-lg">
              <table className="min-w-full divide-y divide-indigo-200 text-sm">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">College Code</th>
                    <th className="px-3 py-2 text-left font-semibold">College Name</th>
                    <th className="px-3 py-2 text-left font-semibold">Branch</th>
                    <th className="px-3 py-2 text-left font-semibold">Course</th>
                    <th className="px-3 py-2 text-left font-semibold">Category</th>
                    <th className="px-3 py-2 text-left font-semibold">Cutoff Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleColleges.map((col, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                      <td className="px-3 py-2">{col.college_code}</td>
                      <td className="px-3 py-2">{col.college_name}</td>
                      <td className="px-3 py-2">{col.branch}</td>
                      <td className="px-3 py-2">{col.course}</td>
                      <td className="px-3 py-2">{col.category}</td>
                      <td className="px-3 py-2">{col.cutoff_rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="mt-5 py-2 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-bold shadow hover:scale-105 transition"
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

      {/* FOOTER */}
      <div className="mt-12 text-center text-indigo-400 text-xs">
        © {new Date().getFullYear()} CET College Predictor. All rights reserved.
      </div>

      {/* Animate CSS */}
      <style jsx global>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }
        .animate-fadein { animation: fadein 0.8s cubic-bezier(.4,0,.2,1); }
        .glass {
          background: rgba(255,255,255,0.70);
          backdrop-filter: blur(12px) saturate(120%);
          box-shadow: 0 10px 32px rgba(84,70,170,0.08);
        }
      `}</style>
    </div>
  );
}

