"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Eye, EyeOff, Lock, User } from "lucide-react";

export default function ClientLoginPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    if (name.trim().toLowerCase() === "ziad" && (code === "1111" || code === "FIT-2024-8842")) {
      // Store session
      localStorage.setItem("client_session", JSON.stringify({ name: "Ziad", code: "1111", loggedIn: true }));
      router.push("/client/dashboard");
    } else {
      setError("Invalid name or member code. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background glow blobs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,252,0,0.06) 0%, transparent 70%)",
          top: "-100px",
          left: "-200px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,252,0,0.04) 0%, transparent 70%)",
          bottom: "-100px",
          right: "-100px",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: "100%",
          maxWidth: 960,
          height: 580,
          display: "flex",
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          margin: "0 16px",
        }}
      >
        {/* Left Branding Panel */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(135deg, rgba(124,252,0,0.08) 0%, rgba(22,22,26,0.9) 100%)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top left lime accent bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 4,
              height: "100%",
              background: "#7CFC00",
            }}
          />

          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "rgba(124,252,0,0.1)",
                border: "1px solid rgba(124,252,0,0.3)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Dumbbell size={22} color="#7CFC00" />
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              FIT & LIFT
            </span>
          </div>

          {/* Hero text */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#7CFC00",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              CLIENT PORTAL
            </div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              Your Fitness
              <br />
              <span style={{ color: "#7CFC00" }}>Journey</span>
              <br />
              Starts Here.
            </h1>
            <p style={{ fontSize: 15, color: "#8B8B8B", lineHeight: 1.6, maxWidth: 280 }}>
              Track workouts, monitor progress, and stay connected with your coach — all in one premium dashboard.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {[
              { label: "Active Members", value: "2,400+" },
              { label: "Workouts Tracked", value: "50K+" },
              { label: "Coaches", value: "18" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#7CFC00" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Login Panel */}
        <div
          style={{
            flex: 1,
            background: "#16161A",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px",
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: 14, color: "#8B8B8B" }}>
              Enter your name and member code to access your dashboard.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 20,
                  fontSize: 14,
                  color: "#EF4444",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Name field */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8B8B8B",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={16}
                  color="#5A5A5A"
                  style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "14px 16px 14px 44px",
                    fontSize: 15,
                    color: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(124,252,0,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            </div>

            {/* Code field */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8B8B8B",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Member Code
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  color="#5A5A5A"
                  style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="•  •  •  •"
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "14px 48px 14px 44px",
                    fontSize: 15,
                    color: "#FFFFFF",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(124,252,0,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#5A5A5A",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              style={{
                width: "100%",
                background: isLoading ? "rgba(124,252,0,0.6)" : "#7CFC00",
                border: "none",
                borderRadius: 12,
                padding: "15px",
                fontSize: 15,
                fontWeight: 700,
                color: "#000000",
                cursor: isLoading ? "not-allowed" : "pointer",
                marginTop: 8,
                transition: "all 0.2s ease",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 0 20px rgba(124,252,0,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </motion.button>
          </form>

          <div
            style={{
              marginTop: 24,
              padding: "16px",
              background: "rgba(124,252,0,0.05)",
              border: "1px solid rgba(124,252,0,0.1)",
              borderRadius: 12,
              fontSize: 13,
              color: "#8B8B8B",
              textAlign: "center",
            }}
          >
            Don&apos;t have a code?{" "}
            <span style={{ color: "#7CFC00", fontWeight: 600, cursor: "pointer" }}>Contact your coach</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
