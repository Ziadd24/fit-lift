"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { useLookupMember, useListAnnouncements, useListPhotos } from "@/lib/api-hooks";
import { Button, Card, Input, Label, Badge } from "@/components/ui/PremiumComponents";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Calendar, CreditCard, LogOut, Bell, ImageIcon,
  ChevronRight, X, Menu, Check, Download,
} from "lucide-react";
import { format } from "date-fns";
import { isMembershipActive, cn } from "@/lib/utils";
import type { Member } from "@/lib/supabase";

interface Bundle {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlight: boolean;
}

function PricingSection() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bundles")
      .then((res) => res.json())
      .then((data) => {
        setBundles(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-8 rounded-xl bg-white/5 border border-white/5 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-32 mb-4" />
            <div className="h-12 bg-white/10 rounded w-24 mb-6" />
            <div className="space-y-3 mb-8">
              {[1, 2, 3, 4].map((f) => (
                <div key={f} className="h-4 bg-white/10 rounded w-full" />
              ))}
            </div>
            <div className="h-12 bg-white/10 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!bundles || bundles.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: "Basic", price: "199", period: "/ mo", features: ["Full gym access", "Locker room", "Free Wi-Fi"], highlight: false },
          { name: "Premium", price: "349", period: "/ mo", features: ["Everything in Basic", "Group classes", "Personal trainer (2x/mo)", "Nutrition consultation"], highlight: true },
          { name: "VIP", price: "599", period: "/ mo", features: ["Everything in Premium", "Unlimited PT sessions", "Priority booking", "Guest passes (2/mo)"], highlight: false },
        ].map((plan) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className={`p-8 h-full flex flex-col ${plan.highlight ? "border border-primary/50 bg-primary/5" : ""}`}>
              {plan.highlight && <Badge className="mb-4 w-fit">Most Popular</Badge>}
              <h4 className="text-2xl font-display text-white mb-2">{plan.name}</h4>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-white">EGP {plan.price}</span>
                <span className="text-muted-foreground mb-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/2010099887771?text=${encodeURIComponent(`Hi! I'm interested in the ${plan.name} membership plan.`)}`}
                target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest h-12 px-6 rounded-xl transition-colors ${plan.highlight ? "bg-primary text-black hover:bg-primary/90" : "border border-white/20 text-white hover:bg-white/10"}`}
              >
                <WhatsAppIcon className="w-4 h-4" /> Get Started
              </a>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {bundles.map((plan) => (
        <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className={`p-8 h-full flex flex-col ${plan.highlight ? "border border-primary/50 bg-primary/5" : ""}`}>
            {plan.highlight && <Badge className="mb-4 w-fit">Most Popular</Badge>}
            <h4 className="text-2xl font-display text-white mb-2">{plan.name}</h4>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-black text-white">EGP {plan.price}</span>
              <span className="text-muted-foreground mb-1">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a
              href={`https://wa.me/2010099887771?text=${encodeURIComponent(`Hi! I'm interested in the ${plan.name} membership plan.`)}`}
              target="_blank" rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-widest h-12 px-6 rounded-xl transition-colors ${plan.highlight ? "bg-primary text-black hover:bg-primary/90" : "border border-white/20 text-white hover:bg-white/10"}`}
            >
              <WhatsAppIcon className="w-4 h-4" /> Get Started
            </a>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function MemberPortal() {
  const { currentMember, setMemberAuth, logoutMember } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "announcements" | "photos">("overview");
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; caption: string } | null>(null);

  const lookupMutation = useLookupMember();
  const { data: announcements } = useListAnnouncements();
  const { data: photos } = useListPhotos(
    currentMember ? { memberId: currentMember.id } : undefined
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) return;
    lookupMutation.mutate(
      { membershipCode: code },
      {
        onSuccess: (member: Member) => {
          setMemberAuth(member.membership_code, member);
          setIsLoginModalOpen(false);
          setCode("");
        },
        onError: () => {
          setError("Invalid membership code. Please check and try again.");
        },
      }
    );
  };

  const handleDownload = async (url: string, caption: string, id: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${caption || `photo-${id}`}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  if (currentMember) {
    const isActive = isMembershipActive(currentMember.sub_expiry_date);
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Member Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="FitGym" className="h-10 w-auto object-contain" />
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={isActive ? "success" : "destructive"}>
                  {isActive ? "Active" : "Expired"}
                </Badge>
                <span className="text-sm text-muted-foreground hidden md:block">{currentMember.name}</span>
                <button
                  onClick={logoutMember}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Welcome banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden mb-8 h-48">
            <img src="/images/gym-hero.png" alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8">
              <div>
                <p className="text-primary text-sm font-bold uppercase tracking-widest mb-1">Welcome Back</p>
                <h1 className="text-3xl md:text-4xl font-display text-white font-black uppercase">{currentMember.name}</h1>
                <p className="text-muted-foreground text-sm mt-1">Code: <span className="font-mono text-white">{currentMember.membership_code}</span></p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: CreditCard, label: "Membership",
                value: currentMember.membership_type,
                sub: null, color: "text-primary"
              },
              {
                icon: Calendar, label: "Expires",
                value: format(new Date(currentMember.sub_expiry_date), "MMM dd, yyyy"),
                sub: null, color: isActive ? "text-green-400" : "text-destructive"
              },
              {
                icon: Dumbbell, label: "Status",
                value: isActive ? "Active Member" : "Membership Expired",
                sub: null, color: isActive ? "text-green-400" : "text-destructive"
              },
            ].map((s) => (
              <Card key={s.label} className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-card/50 rounded-xl border border-white/5 mb-6 w-fit">
            {(["overview", "announcements", "photos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wider transition-all",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Recent Announcements
                </h3>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.slice(0, 3).map((a) => (
                      <div key={a.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="font-bold text-white text-sm">{a.title}</p>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{a.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No announcements yet.</p>
                )}
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-display text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" /> Recent Photos
                </h3>
                {photos && photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 6).map((p) => (
                      <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-black">
                        <img src={p.url} alt={p.caption || ""} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No photos uploaded yet.</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-4">
              {announcements && announcements.length > 0 ? (
                announcements.map((a) => (
                  <Card key={a.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={a.is_global ? "default" : "outline"}>
                        {a.is_global ? "Global" : "Personal"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{a.title}</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No announcements yet.</p>
              )}
            </div>
          )}

          {activeTab === "photos" && (
            <div>
              {photos && photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {photos.map((p) => (
                    <Card key={p.id} className="overflow-hidden group">
                      <div className="h-48 overflow-hidden bg-black relative">
                        <img
                          src={p.url}
                          alt={p.caption || ""}
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-zoom-in"
                          onClick={() => setZoomedPhoto({ url: p.url, caption: p.caption || "No caption" })}
                        />
                        {p.caption && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(p.url, p.caption, p.id);
                            }}
                            className="absolute bottom-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <Download className="w-4 h-4 text-black" />
                          </button>
                        )}
                      </div>
                      {p.caption && (
                        <div className="p-3">
                          <p className="text-sm text-white line-clamp-1">{p.caption}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(p.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-white/10 bg-transparent">
                  <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">No photos for your profile yet.</p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Photo Zoom Modal */}
        <AnimatePresence>
          {zoomedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setZoomedPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setZoomedPhoto(null)}
                  className="absolute -top-12 right-0 text-white hover:text-white/80 transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>
                <div className="bg-card rounded-xl overflow-hidden border border-white/10">
                  <div className="relative">
                    <img
                      src={zoomedPhoto.url}
                      alt={zoomedPhoto.caption}
                      className="w-full max-h-[80vh] object-contain bg-black"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(zoomedPhoto.url, zoomedPhoto.caption, 0);
                      }}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/90 hover:bg-white text-black font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5" /> Download
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-white">{zoomedPhoto.caption}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login modal backdrop close */}
        <AnimatePresence>
          {isLoginModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
              onClick={() => setIsLoginModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="p-8">
                  <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-display text-white mb-6">Member Login</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label>Membership Code</Label>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. FL-1234"
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                    <Button type="submit" className="w-full" disabled={lookupMutation.isPending}>
                      {lookupMutation.isPending ? "Verifying..." : "Access Portal"}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Landing Page (not logged in) ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <img src="/images/logo.png" alt="FitGym" className="h-10 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">About</a>
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">Services</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">Pricing</a>
              <Button onClick={() => setIsLoginModalOpen(true)} className="uppercase tracking-widest font-bold">Member Login</Button>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-20 left-0 right-0 bg-background border-b border-white/10 z-40">
            <div className="px-4 py-6 flex flex-col gap-4">
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white uppercase tracking-wider">About</a>
              <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white uppercase tracking-wider">Services</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-white uppercase tracking-wider">Pricing</a>
              <Button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full mt-4 uppercase tracking-widest font-bold">Member Login</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero_bg.png" alt="Gym" className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/gym-hero.png"; }} />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-white font-black uppercase tracking-tighter leading-none mb-6">
              Push Your <br className="hidden md:block" /><span className="text-primary text-glow">Limits</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto md:mx-0">
              Premium equipment, expert trainers, and a community that pushes you to be your best self. Welcome to the next level of fitness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a
                href={`https://wa.me/2010099887771?text=${encodeURIComponent("Hi FitGym! I'm interested in joining. Could you share the membership plans and pricing?")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-black font-bold text-lg uppercase tracking-widest h-14 px-8 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" /> Join Now
              </a>
              <Button size="lg" variant="outline" onClick={() => setIsLoginModalOpen(true)}
                className="text-lg uppercase tracking-widest font-bold h-14 px-8 border-white/20 hover:bg-white/10 hover:text-white">
                Member Login
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">About Us</h2>
              <h3 className="text-4xl md:text-5xl font-display text-white font-bold mb-6 uppercase">More Than Just A Gym</h3>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                FitGym was founded on a simple principle: provide the best environment for people who are serious about their fitness journey. We are not just a place with weights; we are a community of dedicated individuals.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Whether you are a beginner learning the ropes or a seasoned athlete prepping for competition, our state-of-the-art facility and expert staff are here to support your goals.
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden">
                <img src="/images/gym-hero.png" alt="Gym interior" className="w-full h-80 object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-black p-6 rounded-2xl font-bold">
                <p className="text-4xl font-black">500+</p>
                <p className="text-sm uppercase tracking-widest">Active Members</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">What We Offer</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">World-Class Facilities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Dumbbell, title: "Free Weights", desc: "Fully equipped weight room with barbells, dumbbells, and cable machines for all fitness levels." },
              { icon: Calendar, title: "Group Classes", desc: "Daily classes in HIIT, yoga, spinning, boxing, and more, led by certified expert trainers." },
              { icon: CreditCard, title: "Personal Training", desc: "One-on-one sessions with certified personal trainers tailored to your specific goals." },
            ].map((s) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Card className="p-8 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <s.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="text-xl font-display text-white mb-3">{s.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm text-primary font-bold uppercase tracking-widest mb-2">Membership</h2>
            <h3 className="text-4xl md:text-5xl font-display text-white font-bold uppercase">Choose Your Plan</h3>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src="/images/logo.png" alt="FitGym" className="h-10 w-auto object-contain mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} FitGym. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setIsLoginModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <Card className="p-8">
                <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-display text-white mb-2">Member Login</h2>
                <p className="text-muted-foreground text-sm mb-6">Enter your membership code to access your portal.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Membership Code</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FL-1234" autoFocus />
                  </div>
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  <Button type="submit" className="w-full" disabled={lookupMutation.isPending}>
                    {lookupMutation.isPending ? "Verifying..." : "Access Portal"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
