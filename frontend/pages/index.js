import { useEffect, useState } from "react";

// --- AboutModal (customize as needed) ---
function AboutModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", zIndex: 9999, top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(48,19,69,0.24)", display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{
        background: "#f8f6ff", maxWidth: 540, width: "90vw", borderRadius: 16, boxShadow: "0 12px 64px #6366f115",
        padding: "40px 28px 34px 28px", position: "relative", border: "1.5px solid #d1d5db"
      }}>
        <button style={{
          position: "absolute", right: 16, top: 12, fontSize: 32, color: "#7c3aed", background: "none",
          border: "none", cursor: "pointer", fontWeight: 900, lineHeight: 1
        }} onClick={onClose} title="Close">&times;</button>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#7c3aed", marginBottom: 10, marginTop: 0 }}>About Us</h1>
        <p style={{ fontSize: 16.7, color: "#2d205b", marginBottom: 26 }}>
          <strong>CET College Predictor</strong> is a vibrant, secure web platform designed to help students quickly discover which colleges they are eligible for, based on their CET rank and category.<br /><br />
          <span style={{ color: "#06b06a", fontWeight: 600 }}>This website is proudly owned and operated by <b>Flexiworks</b>.</span>
        </p>
        <h2 style={{
          fontSize: "1.15rem", color: "#4f46e5", marginBottom: 9, fontWeight: 800, marginTop: 28, letterSpacing: "0.01em"
        }}>User Guide</h2>
        <ol style={{
          color: "#2d205b", fontSize: 15.6, lineHeight: 1.63, paddingLeft: 24, marginBottom: 20
        }}>
          <li><b>Select your Course and Category:</b><br />Use the dropdowns to select your course and category.</li>
          <li><b>Enter your CET Rank:</b><br />Type your CET rank in the provided box.</li>
          <li><b>Find Eligible Colleges:</b><br />Click on <b>Find Eligible Colleges</b> to see how many you’re eligible for.</li>
          <li><b>Unlock Full List & Download:</b><br />Pay ₹10 to instantly unlock and download your result.</li>
        </ol>
        <div style={{
          color: "#7c3aed", fontSize: 13, marginTop: 24, fontWeight: 600
        }}>
          <b>Note:</b> This predictor is based on the previous year's official CET cutoff data. Actual cutoffs and seat availability may vary for the current year.
        </div>
        <div style={{
          marginTop: 22, color: "#818cf8", fontSize: 13.2, fontStyle: "italic"
        }}>
          Disclaimer: The information provided is sourced from publicly available official data. The website is not affiliated with KEA or any government agency.  
        </div>
        <div style={{
          marginTop: 26, color: "#2d205b", fontSize: 14, fontWeight: 600
        }}>
          <b>For queries or feedback:</b> contact <b>Flexiworks</b> at <a href="mailto:info@flexiworks.in" style={{ color: "#0ea5e9", textDecoration: "underline" }}>info@flexiworks.in</a>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function Home() {
  const [round, setRound] = useState("Round 1");  // <--- NEW
  const [course, setCourse] = useState("");
  const [category, setCategory] = useState("");
  const [rank, setRank] = useState("");
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locked, setLocked] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [groupedEligible, setGroupedEligible] = useState({});
  const [paid, setPaid] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [formError, setFormError] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [polling, setPolling] = useState(false);

  const apiURL = "";

  useEffect(() => {
    fetch(`${apiURL}/api/options?round=${encodeURIComponent(round)}`)
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setCategories(data.categories || []);
      });
  }, [round]);  // Reload options if round changes

  const handlePredict = async () => {
    if (!validateForm()) return;
    setLocked(false);
    setPaid(false);
    setEligibleCount(0);
    setGroupedEligible({});
    setOrderId("");
    const res = await fetch(`${apiURL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round, course, category, rank }),
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

  // --- Razorpay Integration (supports webhook/intent/collect/UPI QR flows) ---
  const handlePayment = async () => {
    setFormError("");
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
    setOrderId(order.id);

    const options = {
      key: "rzp_live_YoU8Mex88gOhS9",
      amount: order.amount,
      currency: order.currency,
      name: "CET College Predictor",
      description: "Access your eligible colleges list",
      order_id: order.id,
      handler: function () {},
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#7c3aed" },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();

    pollPaymentStatus(order.id);
  };

  const pollPaymentStatus = (orderId) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 36;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/payment-status?order_id=${orderId}`);
      const { paid: isPaid } = await res.json();
      if (isPaid) {
        clearInterval(interval);
        setPaid(true);
        setPolling(false);
        setFormError("");
        fetchUnlockedResult(orderId);
      } else if (++attempts > maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        setFormError(
          "Payment not confirmed yet. If money debited, please click 'Retry Unlock' below after waiting a bit, or contact support with your order ID."
        );
      }
    }, 5000);
  };

  // Retry Unlock
  const handleRetryUnlock = () => {
    if (!orderId) return setFormError("No recent payment found to retry. Please pay again.");
    setFormError("");
    pollPaymentStatus(orderId);
  };

  // Fetch unlocked data after paid
  const fetchUnlockedResult = async (orderId) => {
    const res2 = await fetch(`/api/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round, course, category, rank, order_id: orderId }),
    });
    if (res2.ok) {
      const data2 = await res2.json();
      setGroupedEligible(data2.groupedEligible || {});
    } else {
      setFormError("Payment confirmed but unlock failed. Please refresh or contact support.");
    }
  };

  // Download CSV
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

  // Download PDF (must match backend endpoint)
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

  // --- UI ---
  return (
    <div style={{ background: "linear-gradient(90deg, #f5e6ff 0%, #f5fcff 100%)", minHeight: "100vh" }}>
      <div style={{
        width: "100%", paddingTop: 28, paddingBottom: 28, marginBottom: -36,
        display: "flex", justifyContent: "center",
        background: "linear-gradient(90deg,#7c3aed 0,#f472b6 60%,#06b06a 100%)", boxShadow: "0 4px 32px #bdb4fb24"
      }}>
        <div style={{
          maxWidth: 940, width: "100%", display: "flex", alignItems: "center", gap: 26, justifyContent: "center"
        }}>
          <img src="/college-logo.png" alt="College Hero" style={{
            width: 64, height: 64, borderRadius: 13, border: "2.5px solid #fff",
            background: "#fff", boxShadow: "0 1.5px 6px #fff8", objectFit: "contain"
          }} />
          <div>
            <h1 style={{
              fontSize: "2.3rem", fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "0.01em"
            }}>CET College Predictor</h1>
          </div>
          <button
            onClick={() => setAboutOpen(true)}
            style={{
              marginLeft: "auto", background: "rgba(255,255,255,0.13)", color: "#fff", fontSize: "1.05rem",
              padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700,
              boxShadow: "0 1px 8px #7c3aed30", transition: "all .14s", outline: "none"
            }}
          >About Us / User Guide</button>
        </div>
      </div>
      <main style={{
        maxWidth: 900, margin: "0 auto", borderRadius: 30, boxShadow: "0 10px 32px #7c3aed14",
        border: "1.7px solid #e9d5ff", marginTop: 56, marginBottom: 32, padding: "42px 32px",
        background: "rgba(255,255,255,0.96)", backdropFilter: "blur(7px)"
      }}>
        <div style={{
          background: "#e0e7ff", color: "#4f46e5", border: "1.4px solid #a5b4fc", padding: 16, borderRadius: 15,
          textAlign: "center", marginBottom: 30, fontSize: "1.09rem", fontWeight: 500
        }}>
          Prediction is purely based on previous year cutoff. It may vary for present year.
        </div>
        {formError && (
          <div style={{
            background: "#fca5a5", color: "#7f1d1d", padding: "12px", borderRadius: 8,
            textAlign: "center", marginBottom: 14
          }}>{formError}</div>
        )}
        <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}
          onSubmit={e => { e.preventDefault(); handlePredict(); }}>
          <div>
            <label style={{ fontWeight: 700, color: "#4f46e5" }}>Round</label>
            <select style={{
              width: "100%", fontSize: 17, border: "2px solid #dbeafe", borderRadius: 9, padding: "10px 8px", marginTop: 5
            }} value={round} onChange={e => setRound(e.target.value)} required>
              <option value="Round 1">Round 1</option>
              <option value="Round 2">Round 2</option>
              <option value="Round 3">Round 3</option>
            </select>
          </div>
          {/* --- COURSE and CATEGORY DROPDOWNS as before (but now in column 2 and 3) --- */}
          <div>
            <label style={{ fontWeight: 700, color: "#4f46e5" }}>Course</label>
            <select style={{
              width: "100%", fontSize: 17, border: "2px solid #dbeafe", borderRadius: 9, padding: "10px 8px", marginTop: 5
            }} value={course} onChange={e => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 700, color: "#06b06a" }}>Category</label>
            <select style={{
              width: "100%", fontSize: 17, border: "2px solid #bbf7d0", borderRadius: 9, padding: "10px 8px", marginTop: 5
            }} value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {/* --- RANK input below, spans all columns --- */}
          <div style={{ gridColumn: "1 / span 3" }}>
            <label style={{ fontWeight: 700, color: "#4f46e5" }}>Your Rank</label>
            <input type="number" min="1"
              style={{
                width: "100%", fontSize: 17, border: "2px solid #dbeafe", borderRadius: 9,
                padding: "10px 8px", marginTop: 5
              }}
              value={rank} onChange={e => setRank(e.target.value)} required
            />
          </div>
          <div style={{
            gridColumn: "1 / span 2", textAlign: "center", display: "flex", justifyContent: "center",
            alignItems: "center", gap: 18, flexWrap: "wrap"
          }}>
            <button type="submit" className="ct-btn"
              style={{
                display: "inline-block", background: "linear-gradient(90deg, #7c3aed 0%, #06b06a 100%)",
                color: "#fff", fontWeight: "bold", padding: "15px 40px", borderRadius: 999, fontSize: "1.18rem",
                border: "none", boxShadow: "0 2px 14px #7c3aed30", margin: "12px 0 6px", cursor: "pointer",
                transition: "transform .12s, box-shadow .12s"
              }}
            >Find Eligible Colleges</button>
          </div>
        </form>
        {locked && !paid && (
          <div style={{ textAlign: "center", marginTop: 38 }}>
            <div style={{
              background: "#fdf2f8", border: "1.3px solid #fbcfe8", borderRadius: 14,
              color: "#be185d", fontSize: 24, fontWeight: 800, padding: "24px 8px", marginBottom: 20
            }}>
              {eligibleCount} eligible college{eligibleCount !== 1 ? "s" : ""} found!
            </div>
            <button className="ct-btn" onClick={handlePayment}
              style={{
                background: "linear-gradient(90deg, #f472b6 0%, #06b06a 100%)", fontWeight: 700,
                fontSize: "1.14rem", padding: "13px 34px", borderRadius: 999, border: "none",
                color: "#fff", boxShadow: "0 2px 10px #7c3aed15", cursor: "pointer", marginTop: 0
              }}>
              Pay ₹10 & Unlock Details
            </button>
            <div style={{ marginTop: 8, color: "#818cf8", fontSize: 13 }}>One-time payment, unlock instantly!</div>
            {polling && <div style={{ color: "#818cf8", fontWeight: 600, marginTop: 12 }}>Waiting for payment confirmation...</div>}
            <button onClick={handleRetryUnlock} disabled={polling} style={{
              marginTop: 18, fontSize: 15, fontWeight: 600, background: "#ede9fe",
              color: "#4f46e5", padding: "10px 28px", borderRadius: 13, border: "none", cursor: "pointer"
            }}>Retry Unlock</button>
            <div style={{ color: "#e11d48", marginTop: 12, fontSize: 14 }}>
              <b>Note:</b> For UPI app payments, do not close or refresh this page after payment.<br />
              If money is debited and you’re not unlocked, wait a minute then click <b>Retry Unlock</b>.<br />
              <b>Never pay twice</b>. For support, contact Flexiworks with your order/payment ID.
            </div>
          </div>
        )}
        {paid && groupedEligible && Object.keys(groupedEligible).length > 0 && (
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#7c3aed", textAlign: "center", marginBottom: 30 }}>
              Eligible Colleges (Grouped by Branch)
            </h2>
            <div>
              <div style={{ textAlign: "right", marginBottom: 10 }}>
                <button onClick={handleDownloadCSV} style={{
                  background: "linear-gradient(90deg, #7c3aed 0%, #06b06a 100%)", color: "#fff",
                  fontWeight: 700, border: "none", borderRadius: 999, padding: "11px 22px", fontSize: "1.03rem",
                  boxShadow: "0 1px 6px #7c3aed24", cursor: "pointer", marginRight: 10
                }}>Download as CSV</button>
                <button onClick={handleDownloadPDF} style={{
                  background: "linear-gradient(90deg, #f472b6 0%, #7c3aed 100%)", color: "#fff",
                  fontWeight: 700, border: "none", borderRadius: 999, padding: "11px 22px", fontSize: "1.03rem",
                  boxShadow: "0 1px 6px #7c3aed24", cursor: "pointer"
                }}>Download as PDF</button>
              </div>
              {Object.keys(groupedEligible).map(branchName => (
                <div key={branchName} style={{
                  background: "#f8fafc", borderRadius: 15, border: "2px solid #a7f3d0", marginBottom: 38,
                  boxShadow: "0 2px 8px 0 #e0e7ff25", padding: "30px 12px"
                }}>
                  <div style={{
                    fontSize: "1.25rem", fontWeight: 800, color: "#06b06a", borderBottom: "2px solid #6ee7b7",
                    paddingBottom: 7, marginBottom: 22
                  }}>{branchName}</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%", borderCollapse: "collapse", background: "#f0fdfa", fontSize: "1rem"
                    }}>
                      <thead>
                        <tr>
                          <th style={{ background: "#a7f3d0", color: "#3730a3", fontWeight: 700, padding: "10px 12px" }}>College Code</th>
                          <th style={{ background: "#a7f3d0", color: "#3730a3", fontWeight: 700, padding: "10px 12px" }}>College Name</th>
                          <th style={{ background: "#a7f3d0", color: "#3730a3", fontWeight: 700, padding: "10px 12px" }}>Course</th>
                          <th style={{ background: "#a7f3d0", color: "#3730a3", fontWeight: 700, padding: "10px 12px" }}>Category</th>
                          <th style={{ background: "#a7f3d0", color: "#3730a3", fontWeight: 700, padding: "10px 12px" }}>Cutoff Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedEligible[branchName].map((col, idx) => (
                          <tr key={idx} style={{ background: idx % 2 ? "#f0fdfa" : "#fff" }}>
                            <td style={{ padding: "9px 12px" }}>{col.college_code}</td>
                            <td style={{ padding: "9px 12px" }}>{col.college_name}</td>
                            <td style={{ padding: "9px 12px" }}>{col.course}</td>
                            <td style={{ padding: "9px 12px" }}>{col.category}</td>
                            <td style={{ padding: "9px 12px" }}>{col.cutoff_rank}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <div style={{
        background: "#fffbe5",
        borderRadius: 10,
        padding: "10px 12px 6px",
        margin: "0 auto 13px",
        color: "#a16207",
        fontSize: 15.6,
        fontWeight: 700,
        textAlign: "left",
        maxWidth: 410
      }}>
        <span style={{ fontWeight: 700 }}>
          <span style={{ color: "#ea580c" }}>Important:</span> If you pay using a UPI app (GPay, PhonePe, etc.) and see a <span style={{ color: "#e11d48" }}>"Payment could not be completed"</span> message, <u>do not worry!</u> <br />
          <span style={{ color: "#3730a3" }}>
            If money is debited, simply click <b>Retry Unlock</b> below. Your payment will be verified and you’ll get access instantly.
          </span>
          <br />
          <span style={{ color: "#ef4444" }}><b>Never pay twice.</b></span> <br />
          This message is common for UPI app payments. If payment was debited, <b>Retry Unlock</b> or contact support with your payment/order ID.
        </span>
      </div>
      {/* === Disclaimer Block === */}
      <div style={{
        margin: "18px 0 0",
        fontSize: 14.5,
        color: "#818cf8",
        textAlign: "center",
        fontStyle: "italic",
        lineHeight: 1.6
      }}>
        Disclaimer: This tool is based on publicly available data based on previous years’ cutoffs. Actual seat availability, cutoffs, and admission outcomes may vary for the current year.
      </div>
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

