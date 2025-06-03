import { useEffect, useState } from "react";

// Responsive AboutModal INSIDE this file
function AboutModal({ open, onClose }) {
  // Responsive: use window width if in browser
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 500);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(48,19,69,0.24)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#f8f6ff",
          maxWidth: isMobile ? "98vw" : 580,
          width: isMobile ? "98vw" : "95vw",
          borderRadius: 16,
          boxShadow: "0 12px 64px #6366f115",
          padding: isMobile ? "18px 4vw 14px 4vw" : "40px 28px 34px 28px",
          position: "relative",
          border: "1.5px solid #d1d5db",
          fontSize: isMobile ? "0.97rem" : "1.06rem",
          maxHeight: isMobile ? "95vh" : "93vh",
          overflowY: "auto",
        }}
      >
        <button
          style={{
            position: "absolute",
            right: isMobile ? 10 : 16,
            top: isMobile ? 7 : 12,
            fontSize: isMobile ? 25 : 32,
            color: "#7c3aed",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 900,
            lineHeight: 1,
          }}
          onClick={onClose}
          title="Close"
        >
          &times;
        </button>
        <h1 style={{
          fontSize: isMobile ? "1.35rem" : "2rem",
          fontWeight: 900,
          color: "#7c3aed",
          marginBottom: isMobile ? 8 : 10,
          marginTop: 0,
          letterSpacing: "0.01em"
        }}>
          About Us
        </h1>
        <p style={{
          fontSize: isMobile ? 15 : 16.7,
          color: "#2d205b",
          marginBottom: isMobile ? 18 : 26
        }}>
          <strong>CET College Predictor</strong> is a vibrant, secure web platform designed to help students quickly discover which colleges they are eligible for, based on their CET rank and category.<br /><br />
          <span style={{ color: "#06b06a", fontWeight: 600 }}>This website is proudly owned and operated by <b>Flexiworks</b>.</span>
        </p>
        <h2 style={{
          fontSize: isMobile ? "1.04rem" : "1.15rem",
          color: "#4f46e5",
          marginBottom: isMobile ? 7 : 9,
          fontWeight: 800,
          marginTop: isMobile ? 18 : 28,
          letterSpacing: "0.01em"
        }}>
          User Guide
        </h2>
        <ol style={{
          color: "#2d205b",
          fontSize: isMobile ? 13.9 : 15.6,
          lineHeight: 1.63,
          paddingLeft: isMobile ? 18 : 24,
          marginBottom: isMobile ? 14 : 20
        }}>
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
        <div style={{
          color: "#7c3aed",
          fontSize: isMobile ? 11.3 : 13,
          marginTop: isMobile ? 12 : 24,
          fontWeight: 600
        }}>
          <b>Note:</b> This predictor is based on the previous year's official CET cutoff data. Actual cutoffs and seat availability may vary for the current year.
        </div>
        <div style={{
          marginTop: isMobile ? 15 : 26,
          color: "#2d205b",
          fontSize: isMobile ? 11.8 : 14,
          fontWeight: 600
        }}>
          <b>For queries or feedback:</b> contact <b>Flexiworks</b> at <a href="mailto:rgk1695@gmail.com" style={{ color: "#0ea5e9", textDecoration: "underline" }}>rgk1695@gmail.com</a>
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

  const apiURL = "";

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
      theme: { color: "#7c3aed" },
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

  const violet = "#7c3aed";
  const teal = "#06b06a";
  const bg1 = "linear-gradient(90deg, #f5e6ff 0%, #f5fcff 100%)";

  return (
    <div style={{ background: bg1, minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{
        width: "100%",
        paddingTop: 28,
        paddingBottom: 28,
        marginBottom: -36,
        display: "flex",
        justifyContent: "center",
        background: "linear-gradient(90deg,#7c3aed 0,#f472b6 60%,#06b06a 100%)",
        boxShadow: "0 4px 32px #bdb4fb24"
      }}>
        <div style={{
          maxWidth: 940,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 26,
          justifyContent: "center"
        }}>
          <img
            src="/college-logo.png"
            alt="College Hero"
            style={{
              width: 64,
              height: 64,
              borderRadius: 13,
              border: "2.5px solid #fff",
              background: "#fff",
              boxShadow: "0 1.5px 6px #fff8",
              objectFit: "contain"
            }}
          />
          <div>
            <h1 style={{
              fontSize: "2.3rem",
              fontWeight: 900,
              color: "#fff",
              margin: "0 0 4px",
              letterSpacing: "0.01em"
            }}>
              CET College Predictor
            </h1>
            {/* Tagline removed */}
          </div>
          <button
            onClick={() => setAboutOpen(true)}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.13)",
              color: "#fff",
              fontSize: "1.05rem",
              padding: "9px 20px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 1px 8px #7c3aed30",
              transition: "all .14s",
              outline: "none"
            }}
            onMouseOver={e => e.target.style.background = "#ede9fe"}
            onMouseOut={e => e.target.style.background = "rgba(255,255,255,0.13)"}
          >
            About Us / User Guide
          </button>
        </div>
      </div>
      {/* ...rest of your code remains unchanged... */}
      {/* (main card, form, results, etc.) */}
      {/* ... */}

      <footer style={{
        margin: "24px 0 8px",
        color: "#7c3aed",
        textAlign: "center",
        fontSize: 15.5,
        fontWeight: 600,
        letterSpacing: ".015em"
      }}>
        &copy; {new Date().getFullYear()} CET College Predictor &nbsp; | &nbsp;
        <button style={{
          color: '#0ea5e9', background: "none", border: "none", cursor: "pointer",
          textDecoration: "underline", fontSize: 15.5, padding: 0, fontWeight: 600
        }} onClick={() => setAboutOpen(true)}>
          About Us
        </button>
      </footer>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}


