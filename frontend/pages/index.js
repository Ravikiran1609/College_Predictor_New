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

  const apiURL = ""; // leave blank for same domain/reverse-proxy, or set to your backend URL

  useEffect(() => {
    fetch(`${apiURL}/api/options`)
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setCategories(data.categories || []);
        setBranches(data.branches || []);
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
      key: "rzp_test_xxxxxxxxxxxx", // <-- Your Razorpay test key
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
      theme: { color: "#34d399" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleDownloadCSV = () => {
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
    link.href = window.URL.createObjectURL(blob);
    link.download = "eligible_colleges.csv";
    link.click();
  };

  const handleDownloadPDF = async () => {
    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eligibleColleges, nearMissColleges }),
    });
    if (!response.ok) {
      alert("Failed to generate PDF report. Please try again!");
      return;
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "college_report.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-pink-50 to-emerald-100 flex flex-col items-center px-2">
      {/* HEADER */}
      <header className="w-full flex flex-col items-center py-12 px-3 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 shadow-lg mb-[-56px] relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div>
            <img
              src="https://cdn.pixabay.com/photo/2016/10/28/22/03/book-1780453_1280.png"
              alt="College Hero"
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl bg-white object-cover"
            />
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">CET College Predictor</h1>
            <p className="text-lg md:text-2xl text-white/90 font-medium mb-2 text-center md:text-left">
              Discover your college destiny. <br className="hidden md:inline" />
              <span className="bg-white/30 px-2 py-1 rounded text-emerald-900">Unlock your best possibilities!</span>
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CARD */}
      <main className="w-full max-w-3xl mx-auto rounded-3xl shadow-xl bg-white/80 mt-[-48px] mb-10 p-8 backdrop-blur-lg border border-indigo-100 z-20 relative">
        <div className="mb-6 p-4 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-700 text-sm font-medium text-center">
          Prediction is purely based on previous year cutoff. It may vary for present year.
        </div>

        {formError && (
          <div className="mb-4 rounded text-sm bg-red-100 text-red-700 px-4 py-2 border border-red-200 text-center">{formError}</div>
        )}

        {/* FORM */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => { e.preventDefault(); handlePredict(); }}>
          <div>
            <label className="font-semibold text-indigo-700 block mb-1">Course</label>
            <select className="w-full border-2 border-indigo-200 rounded-lg px-4 py-2 mt-1 bg-white" value={course} onChange={e => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-emerald-700 block mb-1">Category</label>
            <select className="w-full border-2 border-emerald-200 rounded-lg px-4 py-2 mt-1 bg-white" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-pink-700 block mb-1">Branch</label>
            <select className="w-full border-2 border-pink-200 rounded-lg px-4 py-2 mt-1 bg-white" value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-indigo-700 block mb-1">Your Rank</label>
            <input type="number" min="1" className="w-full border-2 border-indigo-200 rounded-lg px-4 py-2 mt-1 bg-white" value={rank} onChange={e => setRank(e.target.value)} required />
          </div>
          <div className="col-span-2 flex justify-center">
            <button
              type="submit"
              className="w-full md:w-auto py-3 px-12 rounded-xl bg-gradient-to-r from-emerald-500 via-violet-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition"
            >
              Find Eligible Colleges
            </button>
          </div>
        </form>

        {locked && !paid && (
          <div className="flex flex-col items-center mt-10">
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-8 py-5 mb-3 text-pink-700 font-semibold text-2xl">
              {eligibleCount} eligible college{eligibleCount !== 1 ? "s" : ""} found!
            </div>
            <button
              onClick={handlePayment}
              className="py-3 px-12 rounded-xl bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500 text-white text-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition"
            >
              Pay ₹10 & Unlock Details
            </button>
            <p className="mt-2 text-xs text-indigo-400">One-time payment, unlock instantly!</p>
          </div>
        )}

        {paid && (eligibleColleges.length > 0 || nearMissColleges.length > 0) && (
          <section className="mt-10">
            <h2 className="text-2xl font-black text-violet-700 mb-6 text-center tracking-tight">Eligible Colleges</h2>
            {eligibleColleges.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border-2 border-violet-100 bg-white shadow mb-10">
                <table className="min-w-full divide-y divide-indigo-100 text-base">
                  <thead className="bg-violet-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">College Code</th>
                      <th className="px-4 py-2 text-left font-semibold">College Name</th>
                      <th className="px-4 py-2 text-left font-semibold">Branch</th>
                      <th className="px-4 py-2 text-left font-semibold">Course</th>
                      <th className="px-4 py-2 text-left font-semibold">Category</th>
                      <th className="px-4 py-2 text-left font-semibold">Cutoff Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleColleges.map((col, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-violet-50"}>
                        <td className="px-4 py-2">{col.college_code}</td>
                        <td className="px-4 py-2">{col.college_name}</td>
                        <td className="px-4 py-2">{col.branch}</td>
                        <td className="px-4 py-2">{col.course}</td>
                        <td className="px-4 py-2">{col.category}</td>
                        <td className="px-4 py-2">{col.cutoff_rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-lg text-pink-600 mb-6">No eligible colleges found.</div>
            )}

            {nearMissColleges.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-emerald-700 mb-3 mt-6 text-center tracking-tight">
                  Near Miss Colleges <span className="text-xs text-pink-700">(within 2000 ranks above your score)</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border-2 border-emerald-100 bg-white shadow mb-10">
                  <table className="min-w-full divide-y divide-emerald-50 text-base">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">College Code</th>
                        <th className="px-4 py-2 text-left font-semibold">College Name</th>
                        <th className="px-4 py-2 text-left font-semibold">Branch</th>
                        <th className="px-4 py-2 text-left font-semibold">Course</th>
                        <th className="px-4 py-2 text-left font-semibold">Category</th>
                        <th className="px-4 py-2 text-left font-semibold">Cutoff Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearMissColleges.map((col, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                          <td className="px-4 py-2">{col.college_code}</td>
                          <td className="px-4 py-2">{col.college_name}</td>
                          <td className="px-4 py-2">{col.branch}</td>
                          <td className="px-4 py-2">{col.course}</td>
                          <td className="px-4 py-2">{col.category}</td>
                          <td className="px-4 py-2">{col.cutoff_rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {(eligibleColleges.length > 0 || nearMissColleges.length > 0) && (
              <div className="flex gap-4 justify-center">
                <button
                  className="mt-4 py-2 px-8 rounded-xl bg-gradient-to-r from-indigo-700 to-emerald-500 text-white font-bold text-lg shadow hover:scale-105 transition"
                  onClick={handleDownloadCSV}
                >
                  Download as CSV
                </button>
                <button
                  className="mt-4 py-2 px-8 rounded-xl bg-gradient-to-r from-rose-600 to-emerald-500 text-white font-bold text-lg shadow hover:scale-105 transition"
                  onClick={handleDownloadPDF}
                >
                  Download as PDF
                </button>
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="mt-6 mb-2 text-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} CET College Predictor
      </footer>
    </div>
  );
}

