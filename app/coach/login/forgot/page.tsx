"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Label } from "@/components/ui/PremiumComponents";
import { Mail, ArrowLeft, Loader2, CheckCircle, Shield, Zap } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call for password reset request
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // In production, this would call an API endpoint
      // const res = await fetch("/api/coach/forgot", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email: email.trim().toLowerCase() }),
      // });
      
      setIsSent(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-3xl p-8 shadow-2xl">
          {/* Mobile Branding Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" 
              style={{ background: "linear-gradient(135deg, #7CFC00, #39FF14)" }}>
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-wide">FIT & LIFT</h1>
              <p className="text-xs text-muted-foreground">Coach Hub</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-display text-white mb-2">
                    Reset Password
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your email and we&apos;ll send you a link to reset your password.
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="coach@fitlift.com"
                      required
                      disabled={isSubmitting}
                      className="mt-1.5"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-display text-white mb-2">
                  Check Your Email
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  We&apos;ve sent a password reset link to<br />
                  <span className="text-white font-medium">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button 
                    onClick={() => setIsSent(false)} 
                    className="text-primary hover:underline"
                  >
                    try again
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-white/5">
            <Link 
              href="/coach/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
