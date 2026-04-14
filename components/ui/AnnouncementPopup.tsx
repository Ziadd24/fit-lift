"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AnnouncementPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchPopupSettings() {
      try {
        const res = await fetch("/api/settings?key=popup_enabled");
        const data = await res.json();
        if (data.value === "true") {
          setEnabled(true);
          const titleRes = await fetch("/api/settings?key=popup_title");
          const titleData = await titleRes.json();
          setTitle(titleData.value || "Special Offer!");
          const msgRes = await fetch("/api/settings?key=popup_message");
          const msgData = await msgRes.json();
          setMessage(msgData.value || "Join now and get 50% off your first month!");
        }
      } catch (e) {
        console.error("Failed to fetch popup settings:", e);
      } finally {
        setLoaded(true);
      }
    }
    fetchPopupSettings();
  }, []);

  useEffect(() => {
    if (loaded && enabled) {
      const timer = setTimeout(() => { setIsVisible(true); }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaded, enabled]);

  if (!loaded || !enabled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-[4px] z-[999]"
          />
          <motion.div
            initial={{ y: -100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: -100, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-5 left-1/2 z-[1000] w-[90vw] min-w-[320px] max-w-md flex items-center gap-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white p-5 rounded-2xl shadow-[0_20px_40px_rgba(34,197,94,0.3),inset_0_0_0_1px_rgba(255,255,255,0.1),0_0_20px_rgba(34,197,94,0.2)]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-xl">💪</div>
            <div className="flex-1">
              <div className="text-base font-bold mb-1 uppercase tracking-wider">{title}</div>
              <div className="text-sm font-medium leading-relaxed opacity-95">{message}</div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Close announcement"
              className="w-8 h-8 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition-all hover:rotate-90 shrink-0 border-none cursor-pointer text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}