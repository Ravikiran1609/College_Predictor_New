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
  const [nearMissColleges, setNearMissColleges] = useState([]);
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
    setNearMissColleges([]);
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
        setEligibleColleges(data2.eligibleColleges || []);
        setNearMissColleges(data2.nearMissColleges || []);
      },
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#4f46e5" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-2">
      {/* HEADER */}
      <div className="w-full max-w-xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-1">CET College Predictor</h1>
        <p className="text-center text-gray-600 text-base mb-3 font-medium">
          Prediction is purely based on previous year cutoff. It may vary for present year.
        </p>
      </div>

      <div className="w-full max-w-xl mx-auto rounded-lg border border-gray-200 shadow bg-white p-6">
        {formError && (
          <div className="mb-4 rounded text-sm bg-red-100 text-red-700 px-4 py-2 border border-red-200">{formError}</div>
        )}

        {/* FORM */}
        <form className="space-y-5" onSubmit={e => { e.preventDefault(); handlePredict(); }}>
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Course</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white" value={course} onChange={e => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Category</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Branch</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white" value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Your Rank</label>
            <input type="number" min="1" className="w-full border border-gray-300 rounded px-3 py-2" value={rank} onChange={e => setRank(e.target.value)} required />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded bg-gray-800 text-white font-semibold text-lg hover:bg-gray-700 transition"
          >
            Find Eligible Colleges
          </button>
        </form>

        {locked && !paid && (
          <div className="flex flex-col items-center mt-8">
            <div className="bg-blue-100 border border-blue-200 rounded px-6 py-4 mb-3 text-blue-800 font-semibold">
              {eligibleCount} eligible college{eligibleCount !== 1 ? "s" : ""} found!
            </div>
            <button
              onClick={handlePayment}
              className="py-3 px-8 rounded bg-blue-700 text-white text-lg font-bold hover:bg-blue-900 transition"
            >
              Pay ₹10 & Unlock Details
            </button>
            <p className="mt-2 text-xs text-gray-400">One-time payment, unlock instantly!</p>
          </div>
        )}

        {paid && (eligibleColleges.length > 0 || nearMissColleges.length > 0) && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-700 mb-3 text-center">Eligible Colleges</h2>
            {eligibleColleges.length > 0 ? (
              <div className="overflow-x-auto rounded border border-gray-200 mb-6">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-100">
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
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
            ) : (
              <div className="text-center text-lg text-blue-700 mb-4">No eligible colleges found.</div>
            )}

            {nearMissColleges.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-blue-700 mb-2 mt-6 text-center">Near Miss Colleges <span className="text-xs text-blue-700">(within 2000 ranks above your score)</span></h3>
                <div className="overflow-x-auto rounded border border-gray-200 mb-6">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-blue-50">
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
                      {nearMissColleges.map((col, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
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
              </>
            )}

            {(eligibleColleges.length > 0 || nearMissColleges.length > 0) && (
              <button
                className="mt-4 py-2 px-8 rounded bg-gray-700 text-white font-semibold shadow hover:bg-gray-900 transition"
                onClick={() => {
                  const csv = [
                    ...(eligibleColleges.length > 0
                      ? [
                          "Eligible Colleges:",
                          Object.keys(eligibleColleges[0]).join(","),
                          ...eligibleColleges.map(r => Object.values(r).join(",")),
                        ]
                      : []),
                    "",
                    ...(nearMissColleges.length > 0
                      ? [
                          "Near Miss Colleges:",
                          Object.keys(nearMissColleges[0]).join(","),
                          ...nearMissColleges.map(r => Object.values(r).join(",")),
                        ]
                      : []),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "eligible_colleges.csv";
                  link.click();
                }}>
                Download as CSV
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} CET College Predictor
      </div>
    </div>
  );
}

