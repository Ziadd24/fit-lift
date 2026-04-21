"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import Image from "next/image";
import { useLookupMember } from "@/lib/api-hooks";
import { useAuth } from "@/lib/use-auth";

/* ── Screen-reader only utility (WCAG) ── */
const SrOnly = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      position: "absolute",
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clip: "rect(0,0,0,0)",
      whiteSpace: "nowrap",
      borderWidth: 0,
    }}
  >
    {children}
  </span>
);

export default function ClientLoginPage() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [memberName, setMemberName] = useState("");
  const router = useRouter();

  const { setMemberAuth, currentMember, logoutMember } = useAuth();
  const lookupMutation = useLookupMember();

  const isLoading = lookupMutation.isPending;
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand to hydrate from localStorage before doing auth checks
  useEffect(() => {
    document.title = "Client Login — Fit & Lift";
    // Small delay to let Zustand persist middleware rehydrate
    const t = setTimeout(() => setHydrated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Redirect if already logged in via Zustand (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (currentMember) {
      router.push("/client/dashboard");
    }
  }, [currentMember, router, hydrated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    lookupMutation.mutate(
      { membershipCode: code.trim() },
      {
        onSuccess: (member) => {
          setMemberAuth(member.membership_code, member);
          setMemberName(member.name);
          setLoginSuccess(true);
          setTimeout(() => router.replace("/client/dashboard"), 1200);
        },
        onError: (err) => {
          setError(err.message || "Member not found. Please check your code.");
        },
      }
    );
  };

  // Clear error when user starts typing
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    if (error) setError("");
  };

  const inputBase =
    "w-full h-14 bg-[rgba(255,255,255,0.04)] border rounded-xl pl-11 pr-12 text-base text-white outline-none transition-colors duration-200 font-['Inter',sans-serif] focus:bg-[rgba(255,255,255,0.06)]";

  const inputNormal = `${inputBase} border-white/[0.08] focus:border-[rgba(124,252,0,0.4)] placeholder:text-[#8B8B8B]`;
  const inputError = `${inputBase} border-[rgba(239,68,68,0.4)] focus:border-[rgba(239,68,68,0.5)] placeholder:text-[#8B8B8B]`;
  const inputDisabled = "opacity-50 cursor-not-allowed";

  return (
    <div
      role="main"
      aria-label="Client login"
      className="min-h-[100dvh] bg-[#0D0D10] flex items-center justify-center font-['Inter',sans-serif] overflow-x-hidden relative px-4 py-6 sm:py-8"
    >
      {/* Skip to content link (WCAG 2.1) */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-[#7CFC00] focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to login form
      </a>

      {/* Background glow blobs (decorative) */}
      <div aria-hidden="true">
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
      </div>

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
        <div
          aria-hidden="true"
          className="hidden md:flex flex-1 flex-col justify-between p-10 relative bg-gradient-to-br from-[rgba(124,252,0,0.08)] to-transparent border-r border-white/[0.06]"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#7CFC00]" />

          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="FIT & LIFT"
              width={140}
              height={44}
              className="h-11 w-auto object-contain"
              priority
            />
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
                <div className="text-[11px] text-[#8B8B8B] uppercase tracking-[1px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Right Login Panel ═══ */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 md:p-12 bg-[#16161A] min-h-0">
          {/* Mobile-only compact header */}
          <div className="md:hidden flex items-center gap-3 mb-6" aria-hidden="true">
            <Image
              src="/images/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-auto object-contain shrink-0"
              priority
            />
            <div>
              <span className="text-lg font-extrabold text-white tracking-[2px] uppercase font-['Montserrat',sans-serif]">
                FIT & LIFT
              </span>
              <div className="text-[10px] font-bold text-[#7CFC00] tracking-[2px] uppercase">
                Client Portal
              </div>
            </div>
          </div>

          {/* ═══ Success State ═══ */}
          <AnimatePresence mode="wait">
            {loginSuccess ? (
              <motion.div
                key="success"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="w-20 h-20 rounded-full bg-[#7CFC00] flex items-center justify-center mb-5"
                  style={{ boxShadow: "0 0 30px rgba(124,252,0,0.4)" }}
                >
                  <Check size={36} className="text-black" strokeWidth={3} />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2 font-['Montserrat',sans-serif]"
                >
                  Welcome, {memberName}!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-[#8B8B8B]"
                >
                  Redirecting to your dashboard...
                </motion.p>
                <SrOnly>Login successful. Redirecting to dashboard.</SrOnly>
              </motion.div>
            ) : (
              /* ═══ Login Form ═══ */
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Heading */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-[26px] font-bold text-white mb-2 font-['Montserrat',sans-serif]">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-[#8B8B8B] leading-relaxed">
                    Enter your membership code to access your dashboard.
                  </p>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      id="login-error"
                      role="alert"
                      aria-live="assertive"
                      aria-atomic="true"
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
                <form
                  id="login-form"
                  onSubmit={handleLogin}
                  className="space-y-4 sm:space-y-5"
                  noValidate
                >
                  {/* Code field */}
                  <div>
                    <label
                      htmlFor="code-input"
                      className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-[1px] mb-2 block"
                    >
                      Membership Code
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8B8B] pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="code-input"
                        type={showCode ? "text" : "password"}
                        value={code}
                        onChange={handleCodeChange}
                        placeholder="Enter your member code"
                        required
                        disabled={isLoading}
                        autoFocus
                        autoComplete="off"
                        aria-describedby={error ? "login-error" : undefined}
                        aria-invalid={!!error}
                        aria-required="true"
                        className={`${error ? inputError : inputNormal} ${isLoading ? inputDisabled : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B8B8B] hover:text-white transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7CFC00]"
                        aria-label={showCode ? "Hide member code" : "Show member code"}
                      >
                        {showCode ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#8B8B8B] mt-1.5">
                      Enter your full membership code or just the last 4 digits (e.g. FIT-0001 or 0001)
                    </p>
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.97 }}
                    aria-busy={isLoading}
                    className="w-full h-14 mt-2 bg-[#7CFC00] hover:bg-[#6BE000] disabled:bg-[rgba(124,252,0,0.6)] border-none rounded-xl text-[15px] font-bold text-black cursor-pointer disabled:cursor-not-allowed transition-all duration-200 font-['Inter',sans-serif] uppercase tracking-[1px] flex items-center justify-center gap-2 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161A]"
                    style={{
                      boxShadow: "0 0 20px rgba(124,252,0,0.3)",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        Looking up...
                      </>
                    ) : (
                      "Access Dashboard"
                    )}
                  </motion.button>
                </form>

                <SrOnly>
                  {isLoading && "Authenticating, please wait"}
                </SrOnly>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
