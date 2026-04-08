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

    if (
      name.trim().toLowerCase() === "ziad" &&
      (code === "1111" || code === "FIT-2024-8842")
    ) {
      localStorage.setItem(
        "client_session",
        JSON.stringify({ name: "Ziad", code: "1111", loggedIn: true })
      );
      router.push("/client/dashboard");
    } else {
      setError("Invalid name or member code. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0D0D10] flex items-center justify-center font-['Inter',sans-serif] overflow-x-hidden relative px-4 py-6 sm:py-8">
      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-48 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(124,252,0,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(124,252,0,0.04) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[960px] glass-panel rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative"
        style={{
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* ═══ Left Branding Panel (hidden on mobile) ═══ */}
        <div className="hidden md:flex flex-1 flex-col justify-between p-10 relative bg-gradient-to-br from-[rgba(124,252,0,0.08)] to-transparent border-r border-white/[0.06]">
          {/* Lime accent bar */}
          <div className="absolute top-0 left-0 w-1 h-full bg-[#7CFC00]" />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[rgba(124,252,0,0.1)] border border-[rgba(124,252,0,0.3)] rounded-xl flex items-center justify-center">
              <Dumbbell size={22} className="text-[#7CFC00]" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-[3px] uppercase font-['Montserrat',sans-serif]">
              FIT & LIFT
            </span>
          </div>

          {/* Hero text */}
          <div>
            <div className="text-[11px] font-bold text-[#7CFC00] tracking-[3px] uppercase mb-4">
              CLIENT PORTAL
            </div>
            <h1 className="text-[42px] font-bold text-white leading-[1.1] mb-4 font-['Montserrat',sans-serif]">
              Your Fitness
              <br />
              <span className="text-[#7CFC00]">Journey</span>
              <br />
              Starts Here.
            </h1>
            <p className="text-[15px] text-[#8B8B8B] leading-relaxed max-w-[280px]">
              Track workouts, monitor progress, and stay connected with your
              coach — all in one premium dashboard.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4 border-t border-white/[0.06]">
            {[
              { label: "Active Members", value: "2,400+" },
              { label: "Workouts Tracked", value: "50K+" },
              { label: "Coaches", value: "18" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-bold text-[#7CFC00]">
                  {stat.value}
                </div>
                <div className="text-[11px] text-[#5A5A5A] uppercase tracking-[1px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Right Login Panel ═══ */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 md:p-12 bg-[#16161A] min-h-0">
          {/* Mobile-only compact header */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[rgba(124,252,0,0.1)] border border-[rgba(124,252,0,0.3)] rounded-xl flex items-center justify-center shrink-0">
              <Dumbbell size={20} className="text-[#7CFC00]" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-[2px] uppercase font-['Montserrat',sans-serif]">
                FIT & LIFT
              </span>
              <div className="text-[10px] font-bold text-[#7CFC00] tracking-[2px] uppercase">
                Client Portal
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-2 font-['Montserrat',sans-serif]">
              Welcome Back
            </h2>
            <p className="text-sm text-[#8B8B8B] leading-relaxed">
              Enter your name and member code to access your dashboard.
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-xl px-4 py-3 mb-5 text-sm text-[#EF4444] font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* Name field */}
            <div>
              <label className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-[1px] mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A5A] pointer-events-none"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  autoComplete="name"
                  className="w-full h-14 bg-[rgba(255,255,255,0.04)] border border-white/[0.08] rounded-xl pl-11 pr-4 text-[15px] text-white outline-none transition-colors duration-200 font-['Inter',sans-serif] placeholder:text-[#5A5A5A] focus:border-[rgba(124,252,0,0.4)] focus:bg-[rgba(255,255,255,0.06)]"
                />
              </div>
            </div>

            {/* Code field */}
            <div>
              <label className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-[1px] mb-2 block">
                Member Code
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A5A] pointer-events-none"
                />
                <input
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-14 bg-[rgba(255,255,255,0.04)] border border-white/[0.08] rounded-xl pl-11 pr-12 text-[15px] text-white outline-none transition-colors duration-200 font-['Inter',sans-serif] placeholder:text-[#5A5A5A] focus:border-[rgba(124,252,0,0.4)] focus:bg-[rgba(255,255,255,0.06)]"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A5A5A] hover:text-[#8B8B8B] transition-colors p-1 touch-target min-w-[36px] min-h-[36px]"
                  tabIndex={-1}
                  aria-label={showCode ? "Hide code" : "Show code"}
                >
                  {showCode ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.97 }}
              className="w-full h-14 mt-2 bg-[#7CFC00] hover:bg-[#6BE000] disabled:bg-[rgba(124,252,0,0.6)] border-none rounded-xl text-[15px] font-bold text-black cursor-pointer disabled:cursor-not-allowed transition-all duration-200 font-['Inter',sans-serif] uppercase tracking-[1px] flex items-center justify-center gap-2 active:scale-[0.97]"
              style={{
                boxShadow: "0 0 20px rgba(124,252,0,0.3)",
              }}
            >
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}