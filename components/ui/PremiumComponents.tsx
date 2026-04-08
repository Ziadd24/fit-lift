"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 hover:box-glow hover:-translate-y-0.5 border border-transparent",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5 hover:-translate-y-0.5",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] border border-transparent hover:-translate-y-0.5",
    outline:
      "bg-transparent text-foreground border border-border hover:bg-white/5 hover:border-white/20",
    ghost: "bg-transparent text-foreground hover:bg-white/5",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg font-bold",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-display uppercase tracking-wider transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

export const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        "glass-panel rounded-2xl overflow-hidden relative group",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-14 sm:h-12 w-full rounded-lg sm:rounded-xl border border-white/10 bg-black/40 px-4 py-3 sm:py-2 text-base shadow-sm transition-all text-white",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-black/60",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs sm:text-sm font-medium leading-none text-muted-foreground mb-1.5 block",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export const Badge = ({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "destructive" | "outline";
  className?: string;
}) => {
  const variants = {
    default: "bg-primary/20 text-primary border border-primary/30",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    destructive: "bg-destructive/20 text-destructive border border-destructive/30",
    outline: "bg-transparent text-foreground border border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-display tracking-wide uppercase",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
