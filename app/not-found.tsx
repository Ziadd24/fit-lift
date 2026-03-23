"use client";

import Link from "next/link";
import { Button } from "@/components/ui/PremiumComponents";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="w-20 h-20 bg-card border border-white/10 rounded-2xl mx-auto flex items-center justify-center mb-6 box-glow">
          <Dumbbell className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-8xl font-display font-black text-white mb-4">
          4<span className="text-primary text-glow">0</span>4
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page skipped leg day — it&apos;s nowhere to be found.
        </p>
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </motion.div>
    </div>
  );
}
