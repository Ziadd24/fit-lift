"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AnnouncementPopup({ title: propTitle, message: propMessage }: { title?: string; message?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (propTitle && propMessage) {
      setTitle(propTitle);
      setMessage(propMessage);
      setEnabled(true);
      setLoaded(true);
      return;
    }
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
  }, [propTitle, propMessage]);

  useEffect(() => {
    if (loaded && enabled) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loaded, enabled]);

  if (!loaded || !enabled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-16 left-0 right-0 z-[1000] bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b-2 border-b-[#7CFC00]/60 shadow-xl min-h-[80px]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 relative min-h-[100px]">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="w-20 h-1 bg-[#7CFC00]/60"></div>
              <img src="/images/logo.png" alt="FIT & LIFT" className="h-12 w-auto object-contain" />
              <div className="w-20 h-1 bg-[#7CFC00]/60"></div>
            </div>
            <div className="pt-10 text-center">
              <h3 className="text-xl sm:text-lg font-bold tracking-wide text-white mb-1 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent drop-shadow-sm" dir="auto">{title}</h3>
              <p className="text-base sm:text-sm text-zinc-300 leading-relaxed" dir="auto">{message}</p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Close announcement"
              className="absolute top-2 right-4 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-200">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}