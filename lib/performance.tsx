"use client";

import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

type DashboardMotionState = {
  prefersReducedMotion: boolean;
  disableHeavyAnimations: boolean;
};

export function useDashboardMotion(): DashboardMotionState {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [disableHeavyAnimations, setDisableHeavyAnimations] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionSettings = () => {
      const reduced = mediaQuery.matches;
      const lowPowerDevice = (navigator.hardwareConcurrency || 4) <= 4;
      setPrefersReducedMotion(reduced);
      setDisableHeavyAnimations(reduced || lowPowerDevice);
    };

    updateMotionSettings();
    mediaQuery.addEventListener("change", updateMotionSettings);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionSettings);
    };
  }, []);

  return { prefersReducedMotion, disableHeavyAnimations };
}

export function SkeletonBlock({
  width = "100%",
  height,
  radius = 14,
  style,
}: {
  width?: number | string;
  height: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="dashboard-skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function LazyRenderSection({
  children,
  fallback,
  minHeight,
  rootMargin = "160px 0px",
  className,
  style,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: number | string;
  rootMargin?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin,
  });

  return (
    <div ref={ref} className={className} style={{ minHeight, ...style }}>
      {inView ? children : fallback}
    </div>
  );
}
