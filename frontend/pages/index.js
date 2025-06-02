import { useEffect, useState } from "react";

// Modal component for About/Guide
function AboutModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", zIndex: 9999, top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.34)", display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{
        background: "#f0fdfa", maxWidth: 580, width: "95vw",
        borderRadius: 20, boxShadow: "0 8px 32px #818cf880", padding: "36px 22px 30px 22px", position: "relative"
      }}>
        <button
          style={{
            position: "absolute", right: 12, top: 12, fontSize: 26, color: "#7c3aed", background: "none",
            border: "none", cursor: "pointer", fontWeight: 900
          }}
          onClick={onClose}
          title="Close"
        >&times;</button>
        <h1 style={{
          fontSize: "2rem", fontWeight: 800, color: "#6d28d9", marginBottom: 8, marginTop: 0
        }}>
          About Us
        </h1>
        <p style={{ fontSize: 16, color: "#334155", marginBottom: 24 }}>
          <strong>CET College Predictor</strong> is a simple, secure web platform designed to help students quickly discover which colleges they are eligible for, based on their CET rank and category.<br /><br />
          <span style={{ color: "#059669" }}>This website is proudly owned and operated by <b>Flexiworks</b>.</span>
        </p>
        <h2 style={{
          fontSize: "1.13rem",
          color: "#0ea5e9",
          marginBottom: 8,
          fontWeight: 700,
          marginTop: 22
        }}>
          User Guide
        </h2>
        <ol style={{ color: "#334155", fontSize: 15, lineHeight: 1.56, paddingLeft: 24, marginBottom: 20 }}>
          <li><b>Select your Course and Category:</b><br />
            Use the dropdowns on the homepage to select your preferred course (like Engineering, Agriculture, etc.) and your reservation category (GM, SC, ST, etc.).
          </li>
          <li><b>Enter your CET Rank:</b><br />
            Type your CET rank in the provided box.
          </li>
          <li><b>Find Eligible Colleges:</b><br />
            Click on <b>Find Eligible Colleges</b> to see how many colleges you are eligible for, grouped by branch.
          </li>
          <li><b>Unlock Full List & Download:</b><br />
            Pay a small, secure fee (₹10 via Razorpay) to instantly view the detailed list and download your result as a PDF or CSV file.
          </li>
          <li><b>Download or Print:</b><br />
            After unlocking, download your personalized college list report in PDF or CSV format for future reference.
          </li>
        </ol>
        <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 20 }}>
          <b>Note:</b> This predictor is based on the previous year's official CET cutoff data. Actual cutoffs and seat availability may vary for the current year.
        </div>
        <div style={{ marginTop: 26, color: "#475569", fontSize: 14 }}>
          <b>For queries or feedback:</b> contact <b>Flexiworks</b> at <a href="mailto:info@flexiworks.in">info@flexiworks.in</a>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [course, setCourse] = useState("");
  const [category, setCategory] = useState("");
  const [rank, setRank] = useState("");
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locked, setLocked] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [groupedEligible, setGroupedEligible] = useState({});
  const [paid, setPaid] = useState(false);
  const [formError, setFormError] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);

  const apiURL = ""; // blank for reverse proxy; or your backend URL

  useEffect(() => {
    fetch(`${apiURL}/api/options`)
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setCategories(data.categories || []);
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
    setGroupedEligible({});
    const res = await fetch(`${apiURL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, category, rank }),
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
      await new Promise((resolve) => { script.onload = resolve; });
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
          body: JSON.stringify({ course, category, rank }),
        });
        const data2 = await res2.json();
        setGroupedEligible(data2.groupedEligible || {});
      },
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#34d399" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleDownloadCSV = () => {
    let csv = "";
    for (const branchName of Object.keys(groupedEligible)) {
      csv += `Branch: ${branchName}\nCollege Code,College Name,Course,Category,Cutoff Rank\n`;
      groupedEligible[branchName].forEach(col => {
        csv += [
          col.college_code, col.college_name, col.course, col.category, col.cutoff_rank
        ].join(",") + "\n";
      });
      csv += "\n";
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "eligible_colleges_by_branch.csv";
    link.click();
  };

  const handleDownloadPDF = async () => {
    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupedEligible }),
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
    <div>
      {/* HEADER */}
      <div className="header-gradient" style={{width: "100%", paddingTop: 32, paddingBottom: 32, marginBottom: -36}}>
        <div style={{maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 28}}>
          <div>
            <img
              src="/cc9830c7-27c0-4e42-931e-9e2e5681ab8f.png" // Place your image here in public/
              alt="College Hero"
              style={{width: 90, height: 90, borderRadius: 20, border: "4px solid #fff", background: "#fff", boxShadow: "0 4px 16px #fff8"}}
            />
          </div>
          <div>
            <h1 style={{fontSize: "2.7rem", fontWeight: 900, color: "#fff", margin: "0 0 7px"}}>CET College Predictor</h1>
            <p style={{
              fontSize: 15,
              color: "#3730a3", // now dark for contrast
              margin: 0,
              letterSpacing: "0.01em",
              fontWeight: 500,
              whiteSpace: "nowrap"
            }}>
              Discover your college destiny. Unlock your best possibilities!
            </p>
          </div>
          <button
            onClick={() => setAboutOpen(true)}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.13)",
              color: "#fff",
              fontSize: "1rem",
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              boxShadow: "0 1px 6px #7c3aed30"
            }}
          >
            About Us / User Guide
          </button>
        </div>
      </div>

      <main className="ct-main-card">
        <div className="note-alert">
          Prediction is purely based on previous year cutoff. It may vary for present year.
        </div>

        {formError && (
          <div style={{background: "#fca5a5", color: "#7f1d1d", padding: "12px", borderRadius: 8, textAlign: "center", marginBottom: 14}}>
            {formError}
          </div>
        )}

        {/* FORM */}
        <form
          style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20}}
          onSubmit={e => { e.preventDefault(); handlePredict(); }}
        >
          <div>
            <label style={{fontWeight: 600, color: "#3730a3"}}>Course</label>
            <select style={{width: "100%", fontSize: 17, border: "2px solid #dbeafe", borderRadius: 8, padding: "8px 8px", marginTop: 5}} value={course} onChange={e => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{fontWeight: 600, color: "#059669"}}>Category</label>
            <select style={{width: "100%", fontSize: 17, border: "2px solid #bbf7d0", borderRadius: 8, padding: "8px 8px", marginTop: 5}} value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={{gridColumn: "1 / span 2"}}>
            <label style={{fontWeight: 600, color: "#3730a3"}}>Your Rank</label>
            <input type="number" min="1"
              style={{width: "100%", fontSize: 17, border: "2px solid #dbeafe", borderRadius: 8, padding: "8px 8px", marginTop: 5}}
              value={rank} onChange={e => setRank(e.target.value)} required
            />
          </div>
          <div style={{gridColumn: "1 / span 2", textAlign: "center"}}>
            <button type="submit" className="ct-btn">
              Find Eligible Colleges
            </button>
          </div>
        </form>

        {locked && !paid && (
          <div style={{textAlign: "center", marginTop: 36}}>
            <div style={{background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 12, color: "#be185d", fontSize: 22, fontWeight: 700, padding: "20px 8px", marginBottom: 20}}>
              {eligibleCount} eligible college{eligibleCount !== 1 ? "s" : ""} found!
            </div>
            <button className="ct-btn" onClick={handlePayment}>
              Pay ₹10 & Unlock Details
            </button>
            <div style={{marginTop: 8, color: "#818cf8", fontSize: 13}}>One-time payment, unlock instantly!</div>
          </div>
        )}

        {paid && groupedEligible && Object.keys(groupedEligible).length > 0 && (
          <section style={{marginTop: 36}}>
            <h2 style={{fontSize: "2rem", fontWeight: 900, color: "#7c3aed", textAlign: "center", marginBottom: 30}}>
              Eligible Colleges (Grouped by Branch)
            </h2>
            <div>
              {Object.keys(groupedEligible).map(branchName => (
                <div key={branchName} className="branch-section">
                  <div className="branch-title">{branchName}</div>
                  <div style={{overflowX: "auto"}}>
                    <table className="table-elig">
                      <thead>
                        <tr>
                          <th>College Code</th>
                          <th>College Name</th>
                          <th>Course</th>
                          <th>Category</th>
                          <th>Cutoff Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedEligible[branchName].map((col, idx) => (
                          <tr key={idx}>
                            <td>{col.college_code}</td>
                            <td>{col.college_name}</td>
                            <td>{col.course}</td>
                            <td>{col.category}</td>
                            <td>{col.cutoff_rank}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display: "flex", gap: 22, justifyContent: "center", marginTop: 30}}>
              <button className="ct-btn" onClick={handleDownloadCSV}>Download as CSV</button>
              <button className="ct-btn" onClick={handleDownloadPDF}>Download as PDF</button>
            </div>
          </section>
        )}
      </main>
      <footer style={{margin: "24px 0 8px", color: "#818cf8", textAlign: "center", fontSize: 14}}>
        &copy; {new Date().getFullYear()} CET College Predictor &nbsp; | &nbsp;
        <button style={{
          color:'#6366f1', background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 14, padding: 0
        }} onClick={() => setAboutOpen(true)}>
          About Us
        </button>
      </footer>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

