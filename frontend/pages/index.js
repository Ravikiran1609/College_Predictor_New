import React, { useState, useEffect } from "react";
import Script from "next/script";

function AboutModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, zIndex: 9999, width: "100vw", height: "100vh",
      background: "rgba(120,70,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, maxWidth: 520, width: "96vw", boxShadow: "0 12px 30px #7c3aed30",
        padding: "34px 32px 30px 32px", position: "relative", margin: "10px", overflowY: "auto", maxHeight: "94vh"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", right: 17, top: 14, background: "none", border: "none", fontSize: 30, color: "#9333ea", cursor: "pointer"
        }}>&times;</button>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#9333ea", marginBottom: 10 }}>About Us</div>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
          <span style={{ color: "#9333ea" }}>CET College Predictor</span>
        </div>
        <div style={{ fontSize: 15, marginBottom: 16 }}>
          is a secure platform by <b>Flexiworks</b> for Karnataka CET students to instantly discover which Engineering & Agriculture colleges they can get, based on their rank and category. No registration needed!
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, margin: "22px 0 8px", color: "#2563eb" }}>User Guide</div>
        <ol style={{ fontSize: 15, marginLeft: 18, marginBottom: 0, paddingLeft: 12 }}>
          <li>
            <b>Select Course &amp; Category:</b>  
            <span> Use dropdowns for your preferred stream and reservation category.</span>
          </li>
          <li>
            <b>Enter your Rank:</b>
            <span> Fill your official CET rank.</span>
          </li>
          <li>
            <b>Find Eligible Colleges:</b>
            <span> Click <b>Find Eligible Colleges</b> to see how many options you have, grouped by branch.</span>
          </li>
          <li>
            <b>Pay &amp; Unlock List:</b>
            <span> One-time ₹10 payment via Razorpay unlocks the full detailed college list (PDF/CSV export available).</span>
          </li>
          <li>
            <b>Download/Print:</b>
            <span> Save your personalized list for later reference.</span>
          </li>
        </ol>
        <div style={{ margin: "18px 0 0", fontSize: 14, color: "#64748b" }}>
          <b>Disclaimer:</b> This app predicts eligibility using official, publicly available data from past CET rounds.
          Actual cutoffs may vary this year.
        </div>
        <div style={{ margin: "20px 0 0", fontSize: 14, color: "#374151" }}>
          For queries: <b>info@flexiworks.in</b>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // Main UI state
  const [course, setCourse] = useState("");
  const [category, setCategory] = useState("");
  const [rank, setRank] = useState("");
  const [eligibleCount, setEligibleCount] = useState(null);
  const [locked, setLocked] = useState(true);
  const [paying, setPaying] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [paid, setPaid] = useState(false);
  const [groupedEligible, setGroupedEligible] = useState(null);
  const [options, setOptions] = useState({ courses: [], categories: [] });
  const [polling, setPolling] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Load dropdown options
  useEffect(() => {
    fetch("/api/options").then(r => r.json()).then(setOptions);
  }, []);

  // Poll payment status after order is created
  useEffect(() => {
    let poll;
    if (polling && orderId) {
      poll = setInterval(async () => {
        let res = await fetch(`/api/payment-status?order_id=${orderId}`);
        let data = await res.json();
        if (data.paid) {
          setPaid(true);
          setPolling(false);
          unlockAfterPayment();
          clearInterval(poll);
        }
      }, 1800);
    }
    return () => poll && clearInterval(poll);
  }, [polling, orderId]);

  function reset() {
    setEligibleCount(null);
    setLocked(true);
    setPaying(false);
    setPaid(false);
    setGroupedEligible(null);
    setOrderId("");
    setRazorpayOrder(null);
  }

  // Predict eligible count
  async function handlePredict(e) {
    e.preventDefault();
    reset();
    if (!course || !category || !rank) {
      alert("Please select course, category and enter your rank.");
      return;
    }
    let res = await fetch("/api/predict", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, category, rank })
    });
    let data = await res.json();
    setEligibleCount(data.eligibleCount);
    setLocked(data.locked !== false);
  }

  // Unlock full report: payment flow
  async function handleUnlock() {
    setPaying(true);
    // Create Razorpay order
    let res = await fetch("/api/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10 })
    });
    let order = await res.json();
    setRazorpayOrder(order);
    setOrderId(order.id);
    setPaying(false);

    // Show Razorpay checkout
    const rzp = new window.Razorpay({
      key: "rzp_live_YoU8Mex88gOhS9",
      amount: order.amount,
      currency: order.currency,
      name: "CET College Predictor",
      description: "Access your eligible colleges list",
      order_id: order.id,
      handler: function (resp) {
        setPolling(true);
      },
      modal: {
        ondismiss: function () {
          setPolling(true); // Start polling even if modal closed
        }
      },
      theme: { color: "#7c3aed" },
      retry: false,
    });
    rzp.open();
    setPolling(true);
  }

  // After successful payment, fetch unlock data
  async function unlockAfterPayment() {
    let res = await fetch("/api/unlock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, category, rank })
    });
    let data = await res.json();
    setGroupedEligible(data.groupedEligible);
    setLocked(false);
  }

  // Retry unlock (if payment debited but modal showed failed)
  async function handleRetryUnlock() {
    setPolling(true);
    let res = await fetch(`/api/payment-status?order_id=${orderId}`);
    let data = await res.json();
    if (data.paid) {
      setPaid(true);
      setPolling(false);
      unlockAfterPayment();
    } else {
      setPolling(false);
      alert("Payment not confirmed yet. Please wait a few seconds and try Retry Unlock again. Never pay twice.");
    }
  }

  // Download CSV or PDF
  function handleDownloadCSV() {
    if (!groupedEligible) return;
    let csv = "Branch,College Code,College Name,Course,Category,Cutoff Rank\n";
    for (let branch in groupedEligible) {
      groupedEligible[branch].forEach(row => {
        csv += [
          branch, row.college_code, `"${row.college_name}"`, row.course, row.category, row.cutoff_rank
        ].join(",") + "\n";
      });
    }
    let blob = new Blob([csv], { type: "text/csv" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url; a.download = "college_report.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
  }
  async function handleDownloadPDF() {
    if (!groupedEligible) return;
    let res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupedEligible })
    });
    let blob = await res.blob();
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url; a.download = "college_report.pdf";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(125deg, #a78bfa 0%, #fbc2eb 80%, #34d399 100%)",
      fontFamily: "'Nunito', Arial, sans-serif"
    }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(90deg,#9333ea,#06b6d4 90%)", padding: "0 2vw", height: 58
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/college-logo.png" alt="College Hero" style={{ height: 48, width: 48, borderRadius: 13, marginRight: 3, background: "#fff" }} />
          <span style={{
            fontWeight: 900, fontSize: 22, letterSpacing: ".02em",
            color: "#fff"
          }}>CET College Predictor</span>
        </div>
        <button style={{
          background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 11,
          fontWeight: 800, fontSize: 18, padding: "8px 20px", cursor: "pointer", marginRight: 10
        }} onClick={() => setAboutOpen(true)}>
          About Us / User Guide
        </button>
      </header>
      {/* Main box */}
      <main style={{
        maxWidth: 820, margin: "42px auto 0", background: "#fff", borderRadius: 36, padding: "36px 18px 38px",
        boxShadow: "0 12px 40px #7c3aed18", minHeight: 500, position: "relative", zIndex: 1
      }}>
        {/* Note */}
        <div style={{
          background: "#e0e7ff", borderRadius: 18, color: "#3730a3", fontSize: 18, fontWeight: 600,
          textAlign: "center", marginBottom: 36, padding: "15px 12px"
        }}>
          Prediction is purely based on previous year cutoff. It may vary for present year.
        </div>
        <form onSubmit={handlePredict} style={{
          display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", alignItems: "flex-end", marginBottom: 22
        }}>
          <div style={{ flex: 1, minWidth: 180, maxWidth: 350 }}>
            <label style={{ fontWeight: 800, color: "#3730a3", fontSize: 17, display: "block", marginBottom: 7 }}>Course</label>
            <select value={course} onChange={e => setCourse(e.target.value)} style={{
              width: "100%", fontSize: 18, borderRadius: 9, padding: "9px 11px", border: "1.5px solid #a5b4fc", background: "#f8fafc"
            }}>
              <option value="">Select Course</option>
              {options.courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180, maxWidth: 350 }}>
            <label style={{ fontWeight: 800, color: "#059669", fontSize: 17, display: "block", marginBottom: 7 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{
              width: "100%", fontSize: 18, borderRadius: 9, padding: "9px 11px", border: "1.5px solid #6ee7b7", background: "#f8fafc"
            }}>
              <option value="">Select Category</option>
              {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150, maxWidth: 210 }}>
            <label style={{ fontWeight: 800, color: "#3730a3", fontSize: 17, display: "block", marginBottom: 7 }}>Your Rank</label>
            <input type="number" min={1} max={200000} value={rank} onChange={e => setRank(e.target.value.replace(/^0+/, ""))} required
              style={{
                width: "100%", fontSize: 18, borderRadius: 9, padding: "9px 11px", border: "1.5px solid #a5b4fc", background: "#f8fafc"
              }} />
          </div>
          <button type="submit" style={{
            background: "linear-gradient(90deg, #7c3aed 0%, #06b06a 100%)", color: "#fff", fontWeight: 900,
            border: "none", borderRadius: 999, padding: "13px 36px", fontSize: "1.25rem",
            marginTop: 15, marginLeft: 0, boxShadow: "0 3px 16px #7c3aed28", cursor: "pointer"
          }}>
            Find Eligible Colleges
          </button>
        </form>

        {/* UPI Payment/Unlock info */}
        {eligibleCount !== null && locked && (
          <div style={{
            maxWidth: 590, margin: "34px auto 0", background: "#fff7ed",
            borderRadius: 16, boxShadow: "0 2px 18px #7c3aed11", padding: "20px 28px 28px", textAlign: "center"
          }}>
            <div style={{
              fontWeight: 800, fontSize: 22, color: "#7c3aed", marginBottom: 6
            }}>
              {eligibleCount} colleges found. Pay <span style={{ color: "#059669" }}>₹10</span> to unlock full list &amp; download!
            </div>
            <div style={{
              background: "#fffbe5", borderRadius: 10, padding: "10px 12px 6px", margin: "0 auto 13px",
              color: "#a16207", fontSize: 15.6, fontWeight: 700, textAlign: "left", maxWidth: 410
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
            <button disabled={paying || polling} onClick={handleUnlock} style={{
              background: paying ? "#a5b4fc" : "linear-gradient(90deg,#7c3aed,#06b06a 100%)",
              fontWeight: 900, fontSize: "1.14rem", borderRadius: 999, padding: "14px 36px", border: "none",
              color: "#fff", boxShadow: "0 2px 10px #7c3aed15", cursor: "pointer", marginTop: 0
            }}>
              {paying ? "Loading..." : "Pay ₹10 & Unlock Details"}
            </button>
            <div style={{ marginTop: 7, color: "#818cf8", fontSize: 13 }}>One-time payment, unlock instantly!</div>
            {polling &&
              <div style={{ color: "#818cf8", fontWeight: 600, marginTop: 12 }}>
                Waiting for payment confirmation...<br />
                (If paid, just wait a few seconds, or use Retry Unlock below.)
              </div>}
            {orderId &&
              <button onClick={handleRetryUnlock} style={{
                marginTop: 14, background: "#9333ea", color: "#fff", fontWeight: 800,
                border: "none", borderRadius: 8, fontSize: 17, padding: "8px 32px", cursor: "pointer"
              }}>
                Retry Unlock
              </button>}
          </div>
        )}

        {/* Report - grouped eligible table */}
        {groupedEligible && !locked &&
          <div>
            <div style={{ fontWeight: 900, fontSize: 24, color: "#7c3aed", margin: "34px 0 16px" }}>
              Eligible Colleges <span style={{ color: "#0891b2" }}>(Grouped by Branch)</span>
            </div>
            {Object.keys(groupedEligible).length === 0 &&
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 19, marginTop: 19 }}>No eligible colleges found.</div>}
            {Object.entries(groupedEligible).map(([branch, rows]) => (
              <div key={branch} style={{
                margin: "16px 0 30px", borderRadius: 12, background: "#f8fafc",
                border: "2px solid #a7f3d0", boxShadow: "0 1px 7px #7c3aed0a"
              }}>
                <div style={{
                  background: "#d1fae5", fontWeight: 900, color: "#059669", fontSize: 18,
                  padding: "10px 0 8px 20px", borderRadius: "12px 12px 0 0"
                }}>{branch}</div>
                <table style={{
                  width: "100%", borderCollapse: "collapse", fontSize: 16, marginTop: 0
                }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ textAlign: "left", padding: "8px 8px" }}>College Code</th>
                      <th style={{ textAlign: "left", padding: "8px 8px" }}>College Name</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Cutoff Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.college_code + row.college_name + idx}
                        style={{ background: idx % 2 ? "#fff" : "#f9fafb" }}>
                        <td style={{ padding: "7px 8px" }}>{row.college_code}</td>
                        <td style={{ padding: "7px 8px" }}>{row.college_name}</td>
                        <td style={{ textAlign: "center" }}>{row.course}</td>
                        <td style={{ textAlign: "center" }}>{row.category}</td>
                        <td style={{ textAlign: "center" }}>{row.cutoff_rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "center", gap: 22, margin: "22px 0 10px" }}>
              <button onClick={handleDownloadCSV} style={{
                background: "#22c55e", color: "#fff", fontWeight: 800, border: "none", borderRadius: 11,
                padding: "10px 30px", fontSize: 17, boxShadow: "0 2px 10px #a7f3d018", cursor: "pointer"
              }}>
                Download as CSV
              </button>
              <button onClick={handleDownloadPDF} style={{
                background: "#7c3aed", color: "#fff", fontWeight: 800, border: "none", borderRadius: 11,
                padding: "10px 30px", fontSize: 17, boxShadow: "0 2px 10px #a7f3d018", cursor: "pointer"
              }}>
                Download as PDF
              </button>
            </div>
          </div>
        }
      </main>
      {/* About/Guide Modal */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      {/* Footer */}
      <footer style={{
        margin: "34px 0 8px", color: "#818cf8", textAlign: "center", fontSize: 14
      }}>
        © {new Date().getFullYear()} CET College Predictor &nbsp; | &nbsp;
        <a href="#" onClick={e => { e.preventDefault(); setAboutOpen(true()); }} style={{ color: "#6366f1" }}>About Us</a>
      </footer>
    </div>
  );
}

