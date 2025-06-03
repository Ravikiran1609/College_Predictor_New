import React from "react";

function AboutModal({ open, onClose }) {
  // Simple media query to adjust modal styles for mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 500;

  // Responsive modal style
  const modalStyle = {
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
  };

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
      <div style={modalStyle}>
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

export default AboutModal;

