import React from "react";
import { motion } from "framer-motion";
// use this for the Explore Xeno button click
const handleExplore = async () => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });

    if (!res.ok) {
      // non-200 (rare) — treat as not authenticated
      window.location.href = '/login';
      return;
    }

    // safe parse
    const data = await res.json();
    if (data?.authenticated) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  } catch (err) {
    // network or parsing error -> send to login
    console.warn('auth check failed', err);
    window.location.href = '/login';
  }
};

export default function XenoLanding() {
  return (
    <div
  style={{
    position: "relative",
    width: "100%",
    height: "100vh",
    margin: 0,
    padding: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
        background: "url('data:image/jpeg;base64,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') center/cover no-repeat, #050507",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed", // optional: keeps it in place
  }}
>
      {/* Stars & Planets */}
      <img
        src="/planet1.png"
        alt="planet"
        style={{
          position: "absolute",
          right: "6%",
          top: "8%",
          width: "12vw",
          opacity: 0.9,
          zIndex: 1,
          animation: "planetFloat 14s linear infinite",
        }}
      />

      <img
        src="/planet2.png"
        alt="planet2"
        style={{
          position: "absolute",
          left: "4%",
          bottom: "10%",
          width: "18vw",
          opacity: 1,
          zIndex: 1,
          animation: "planetFloat 18s linear reverse infinite",
        }}
      />

      {/* Subtle star layer (pure CSS) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "200px 200px, 100px 100px",
          backgroundPosition: "0 0, 50px 50px",
          opacity: 0.7,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <h1
        style={{
          fontSize: "3.6rem",
          zIndex: 3,
          fontWeight: 800,
          marginBottom: "8px",
          letterSpacing: "4px",
          background: "linear-gradient(90deg, #ff00f2, #00eaff, #ffe600)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          animation: "fadeIn 1.6s ease",
        }}
      >
        XENO
      </h1>

      {/* Bigger colorful subtitle */}
      <p
        style={{
          fontSize: "1.6rem",
          color: "#d6d6d6",
          maxWidth: "820px",
          lineHeight: 1.5,
          zIndex: 3,
          marginBottom: "30px",
        }}
      >
        <span
          style={{
            background: "linear-gradient(90deg, #ff6bff, #5dceff, #ffe45c)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            fontSize: "1.9rem",
            fontWeight: 700,
          }}
        >
          The Most Beautiful & Intelligent Shopify Dashboard Ever Created.
        </span>
      </p>

      {/* Center astronaut animation */}
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{
          y: [0, -22, 10, 0],
          rotate: [0, 3, -3, 0],
          scale: [0.98, 1.02, 0.99],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        style={{
          width: 340,
          height: 340,
          borderRadius: "50%",
          marginTop: 10,
          position: "relative",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "visible",
        }}
      >
        {/* Floating Astronaut */}
       <motion.img
  src="/astronaut.png"
  alt="astronaut"
  initial={{ y: 0, rotate: 2 }}
  animate={{
    y: [0, -8, 0], // smaller vertical movement for smoothness
    rotate: [0, 1, -1, 0], // gentle rotation
  }}
  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} // slower, smoother float
  style={{
    width: "100%",
    zIndex: 6,
    filter: "drop-shadow(0 0 22px rgba(180,240,255,0.35))",
  }}
/>


        {/* Hover wave aura */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1, scale: [1, 1.5, 1] }}
          transition={{ duration: 1.8 }}
          style={{
            position: "absolute",
            width: 540,
            height: 540,
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
            pointerEvents: "none",
            background:
              "radial-gradient(circle, rgba(140,255,255,0.08) 0%, rgba(140,255,255,0.04) 30%, transparent 70%)",
          }}
        />

        {/* Orbiting small sphere */}
        <motion.div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#ffd966",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 8,
            boxShadow: "0 6px 18px rgba(255,200,80,0.3)",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 11, ease: "linear" }}
        />

        {/* Orbit ring */}
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            border: "1px solid rgba(140,230,255,0.08)",
            boxShadow: "0 0 60px rgba(0,170,255,0.04)",
            animation: "orbit 14s linear infinite",
          }}
        />
      </motion.div>

      {/* Feature icons row */}
      <div
        style={{
          display: "flex",
          gap: 32,
          marginTop: 36,
          zIndex: 3,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { img: "/feature1.jpg", text: "Automated Inventory" },
          { img: "/feature2.jpg", text: "Real‑time Analytics" },
          { img: "/feature3.jpg", text: "Smart Order Flow" },
        ].map((box, index) => (
          <div
            key={index}
            style={{
              width: 150,
              textAlign: "center",
              transition: "transform 0.35s ease, opacity 0.35s ease",
              cursor: "pointer",
              opacity: 0.95,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.12)";
              e.currentTarget.style.opacity = "1";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.opacity = "0.95";
            }}
          >
            <img src={box.img} alt={box.text} style={{ width: 70, marginBottom: 10 }} />
            <p style={{ fontSize: 16, color: "#ccefff", margin: 0 }}>{box.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        style={{
          marginTop: 28,
          padding: "12px 34px",
          background: "linear-gradient(90deg, #00eaff, #9c5cff)",
          color: "#000",
          fontSize: 18,
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          zIndex: 4,
          fontWeight: 700,
          transition: "transform 0.28s ease, box-shadow 0.28s ease",
        }}
        onClick={handleExplore}

        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.boxShadow = "0 0 28px rgba(110,238,255,0.25)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Explore Xeno
      </button>

      {/* Inline animations & responsive */}
      <style>{`
        @keyframes orbit { from { transform: translate(-50%, -50%) rotate(0deg);} to { transform: translate(-50%, -50%) rotate(360deg);} }
        @keyframes planetFloat { 0% { transform: translateY(0);} 50% { transform: translateY(-18px);} 100% { transform: translateY(0);} }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(8px);} 100% { opacity: 1; transform: translateY(0);} }

        @media (max-width: 880px) {
          h1 { font-size: 2.4rem !important; }
          p { font-size: 1.05rem !important; }
          div[style*="width: 340"] { width: 240px !important; height: 240px !important; }
        }
      `}</style>
    </div>
  );
}
