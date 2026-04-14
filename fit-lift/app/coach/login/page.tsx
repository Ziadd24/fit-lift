"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { useCoachLogin, useCoachRegister } from "@/lib/api-hooks";
import { Button, Card, Input, Label } from "@/components/ui/PremiumComponents";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Eye, EyeOff } from "lucide-react";

export default function CoachLoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { setCoachAuth, coachToken } = useAuth();
  const router = useRouter();
  const loginMutation = useCoachLogin();
  const registerMutation = useCoachRegister();

  // Redirect if already logged in
  React.useEffect(() => {
    if (coachToken) {
      router.push("/coach");
    }
  }, [coachToken, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "login") {
      if (!name.trim()) {
        setError("Please enter your name");
        return;
      }
      loginMutation.mutate(
        { name, password },
        {
          onSuccess: (res) => {
            setCoachAuth(res.token, res.coach);
            router.push("/coach");
          },
          onError: (err) => setError(err.message),
        }
      );
    } else {
      if (!name.trim()) {
        setError("Please enter your full name");
        return;
      }
      registerMutation.mutate(
        { name, password },
        {
          onSuccess: (res) => {
            setCoachAuth(res.token, res.coach);
            router.push("/coach");
          },
          onError: (err) => setError(err.message),
        }
      );
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[1000px] h-[600px] glass-panel rounded-3xl flex overflow-hidden shadow-2xl mx-4"
      >
        {/* Left Panel — Branding */}
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
              Captain&apos;s
              <br />
              <span className="text-primary text-glow">Portal</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              Manage your clients, schedule sessions, and track progress all in
              one secure, unified dashboard dedicated to our elite coaching
              staff.
            </p>
          </div>
          <p className="text-muted-foreground/40 text-xs font-mono tracking-widest">
            SYSTEM VERSION 2.4.1
          </p>
        </div>

        {/* Right Panel — Forms */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-display text-white mb-2">
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {mode === "login"
                    ? "Enter your credentials to access the dashboard."
                    : "Join the coaching roster to manage your clients."}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-3 mb-6 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label>{mode === "login" ? "Coach Name" : "Full Name"}</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmad"
                    required
                  />
                </div>



                <div className="relative">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required

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
                  {isPending
                    ? mode === "login"
                      ? "Authenticating..."
                      : "Creating Account..."
                    : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-muted-foreground text-sm mt-6">
                {mode === "login" ? (
                  <>
                    New coach?{" "}
                    <button
                      onClick={() => {
                        setMode("register");
                        setError("");
                      }}
                      className="text-primary font-semibold hover:text-white transition-colors"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="text-primary font-semibold hover:text-white transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
