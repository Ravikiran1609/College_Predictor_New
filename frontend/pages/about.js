export default function About() {
  return (
    <div style={{
      maxWidth: 800,
      margin: "0 auto",
      padding: "36px 18px",
      background: "#f0fdfa",
      borderRadius: 18,
      boxShadow: "0 4px 32px #818cf860"
    }}>
      <h1 style={{
        fontSize: "2.2rem",
        fontWeight: 800,
        color: "#6d28d9",
        marginBottom: 8
      }}>
        About Us
      </h1>
      <p style={{ fontSize: 18, color: "#334155", marginBottom: 26 }}>
        <strong>CET College Predictor</strong> is a simple, secure web platform designed to help students quickly discover which colleges they are eligible for, based on their CET rank and category.<br /><br />
        <span style={{ color: "#059669" }}>This website is proudly owned and operated by <b>Flexiworks</b>.</span>
      </p>

      <h2 style={{
        fontSize: "1.3rem",
        color: "#0ea5e9",
        marginBottom: 8,
        fontWeight: 700,
        marginTop: 30
      }}>
        User Guide
      </h2>
      <ol style={{ color: "#334155", fontSize: 17, lineHeight: 1.6, paddingLeft: 24, marginBottom: 26 }}>
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
      <div style={{ color: "#9ca3af", fontSize: 15, marginTop: 32 }}>
        <b>Note:</b> This predictor is based on the previous year's official CET cutoff data. Actual cutoffs and seat availability may vary for the current year.
      </div>
      <div style={{ marginTop: 40, color: "#475569" }}>
        <b>For queries or feedback:</b> contact <b>Flexiworks</b> at <a href="mailto:info@flexiworks.in">info@flexiworks.in</a>
      </div>
    </div>
  );
}

