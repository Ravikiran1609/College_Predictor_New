import '../styles/globals.css'
import { useState } from "react";
import AboutModal from "../components/AboutModal";

export default function App({ Component, pageProps }) {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <nav style={{
        width: "100%",
        background: "linear-gradient(90deg,#7c3aed 0,#f472b6 50%,#34d399 100%)",
        padding: "0.7rem 0",
        boxShadow: "0 2px 16px #818cf860",
        marginBottom: 0
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center" }}>
          <a href="/" style={{
            color: "#fff", fontWeight: 700, fontSize: "1.17rem", textDecoration: "none", marginRight: 32
          }}>
            CET College Predictor
          </a>
          <button
            style={{
              color: "#fff",
              background: "rgba(0,0,0,0.06)",
              fontSize: "1.07rem",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              padding: "4px 16px"
            }}
            onClick={() => setAboutOpen(true)}
          >
            About Us
          </button>
        </div>
      </nav>
      <Component {...pageProps} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}

