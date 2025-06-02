// components/AboutModal.js
export default function AboutModal({ open, onClose }) {
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
          <li><b>1. Select your Course and Category:</b><br />
            Use the dropdowns on the homepage to select your preferred course (like Engineering, Agriculture, etc.) and your reservation category (GM, SC, ST, etc.).
          </li>
          <li><b>2. Enter your CET Rank:</b><br />
            Type your CET rank in the provided box.
          </li>
          <li><b>3. Find Eligible Colleges:</b><br />
            Click on <b>Find Eligible Colleges</b> to see how many colleges you are eligible for, grouped by branch.
          </li>
          <li><b>4. Unlock Full List & Download:</b><br />
            Pay a small, secure fee (₹10 via Razorpay) to instantly view the detailed list and download your result as a PDF or CSV file.
          </li>
          <li><b>5. Download or Print:</b><br />
            After unlocking, download your personalized college list report in PDF or CSV format for future reference.
          </li>
        </ol>
        <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 20 }}>
          <b>Note:</b> This predictor is based on the previous year's official CET cutoff data. Actual cutoffs and seat availability may vary for the current year.
        </div>
        <div style={{ marginTop: 26, color: "#475569", fontSize: 14 }}>
          <b>For queries or feedback:</b> contact <b>Flexiworks</b> at <a href="mailto:vespalx2@gmail.com">info@flexiworks.in</a>
        </div>
      </div>
    </div>
  );
}

