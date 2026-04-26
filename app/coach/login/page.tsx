"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useCoachLogin } from "@/lib/api-hooks";
import { Button, Input, Label } from "@/components/ui/PremiumComponents";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Shield, Zap, Lock, Mail, Loader2 } from "lucide-react";

/* Password strength calculator */
function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 10) score += 2;
  else if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 2;
  
  const levels = [
    { label: "Very Weak", color: "#EF4444" },
    { label: "Weak", color: "#F59E0B" },
    { label: "Fair", color: "#FBB924" },
    { label: "Good", color: "#10B981" },
    { label: "Strong", color: "#7CFC00" },
    { label: "Excellent", color: "#39FF14" },
  ];
  const level = Math.min(Math.max(score, 0), 5);
  return { score: level, ...levels[level] };
}

export default function CoachLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const { setCoachAuth, coachToken } = useAuth();
  const router = useRouter();
  const loginMutation = useCoachLogin();

  const passwordStrength = calculatePasswordStrength(password);

  // Redirect if already logged in (with loading state to prevent flash)
  useEffect(() => {
    if (coachToken) {
      router.push("/coach");
    } else {
      // Small delay to prevent flash
      const timer = setTimeout(() => setIsCheckingAuth(false), 300);
      return () => clearTimeout(timer);
    }
  }, [coachToken, router]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Rate limiting check
    if (lockoutTime > 0) {
      setError(`Too many attempts. Please wait ${lockoutTime} seconds.`);
      return;
    }

    if (!username.trim()) {
      setError("Please enter your username or email");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      await loginMutation.mutateAsync(
        { name: username.trim().toLowerCase(), password },
        {
          onSuccess: (res) => {
            setFailedAttempts(0);
            setCoachAuth(res.token, res.coach, false);
            router.push("/coach");
          },
          onError: (err: any) => {
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            
            // Lockout after 3 failed attempts
            if (newAttempts >= 3) {
              setLockoutTime(30);
              setError(`Too many failed attempts. Locked out for 30 seconds.`);
            } else {
              // Human-readable error messages
              const message = err?.message || "";
              if (message.includes("401") || message.includes("Unauthorized")) {
                setError("Incorrect username or password. Please try again.");
              } else if (message.includes("Network")) {
                setError("Connection issue. Please check your internet and try again.");
              } else if (message.includes("not found")) {
                setError("No account found with this username. Please check or contact your admin.");
              } else {
                setError("Login failed. Please try again or contact your administrator.");
              }
            }
          },
        }
      );
    } catch (err: any) {
      // Error handled in onError callback
    }
  };

  const isLockedOut = lockoutTime > 0;
  const isPending = loginMutation.isPending || isLockedOut;

  // Loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden p-4">
      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1000px] min-h-[600px] glass-panel rounded-3xl flex overflow-hidden shadow-2xl"
      >
        {/* Left Panel — Branding (Desktop) */}
        <div className="hidden md:flex flex-1 flex-col justify-between p-10 bg-gradient-to-br from-primary/15 to-transparent border-r border-white/5 relative">
          <div className="flex items-center gap-0">
            <img
              src="/images/logo.png"
              alt="FitGym"
              className="h-[120px] w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-xl font-black text-primary tracking-widest -ml-4 drop-shadow-md">FIT & LIFT</span>
          </div>
          <div>
            <h1 className="text-4xl font-display text-white font-black leading-tight mb-4">
              Coach
              <br />
              <span className="text-primary text-glow">Hub</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              Manage your clients, schedule sessions, and track progress all in
              one secure, unified dashboard for our professional coaching team.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary/60" />
            <p className="text-muted-foreground/40 text-xs font-mono tracking-widest">
              Secure Staff Portal
            </p>
          </div>
        </div>

        {/* Right Panel — Forms */}
        <div className="flex-1 flex flex-col justify-center p-6 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Mobile Branding Header */}
              <div className="md:hidden flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                  style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)" }}>
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-wide">FIT & LIFT</h1>
                  <p className="text-xs text-muted-foreground">Coach Hub</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-display text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter your credentials to access the dashboard.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-3 mb-6 text-sm font-medium flex items-start gap-2"
                >
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {isLockedOut && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-sm font-medium"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Account locked. Retry in {lockoutTime}s</span>
                  </div>
                  <div className="mt-2 h-1 bg-amber-500/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: lockoutTime, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={isLockedOut}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      required
                      disabled={isLockedOut}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>


                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isLockedOut ? `Locked (${lockoutTime}s)` : "Authenticating..."}
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs text-muted-foreground text-center">
                  Having trouble?{" "}
                  <a href="/admin/support" className="text-primary hover:underline">
                    Contact your administrator
                  </a>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
