"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListMembers, useListAnnouncements, useListPhotos } from "@/lib/api-hooks";
import { Card } from "@/components/ui/PremiumComponents";
import { Users, Megaphone, Image as ImageIcon, Activity, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { isMembershipActive } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: membersPage } = useListMembers();
  const members = membersPage?.members || [];
  const { data: announcements } = useListAnnouncements();
  const { data: photos } = useListPhotos();

  const activeMembers =
    members.filter((m) => isMembershipActive(m.sub_expiry_date)).length || 0;
  const expiredMembers = members.length - activeMembers;

  const stats = [
    { title: "Total Members", value: members?.length || 0, icon: Users, color: "text-blue-500" },
    { title: "Active Members", value: activeMembers, icon: Activity, color: "text-primary" },
    { title: "Announcements", value: announcements?.length || 0, icon: Megaphone, color: "text-purple-500" },
    { title: "Photos Uploaded", value: photos?.length || 0, icon: ImageIcon, color: "text-pink-500" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display text-white mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the FitGym administration panel.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-display text-white mt-1">{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-xl font-display text-white mb-4">Membership Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary box-glow" />
                <span className="font-medium text-white">Active</span>
              </div>
              <span className="text-2xl font-display">{activeMembers}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
                <span className="font-medium text-white">Expired</span>
              </div>
              <span className="text-2xl font-display">{expiredMembers}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <img src="/images/logo-mark.png" alt="" className="w-64 h-64 -mb-10 -mr-10" />
          </div>
          <h3 className="text-xl font-display text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <Link
              href="/admin/members"
              className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors flex flex-col items-center text-center gap-2"
            >
              <Users className="w-6 h-6" />
              <span className="font-medium text-sm">Manage Members</span>
            </Link>
            <Link
              href="/admin/announcements"
              className="p-4 rounded-xl bg-secondary hover:bg-white/10 border border-white/5 transition-colors flex flex-col items-center text-center gap-2 text-white"
            >
              <Megaphone className="w-6 h-6" />
              <span className="font-medium text-sm">Post Update</span>
            </Link>
            <Link
              href="/admin/photos"
              className="p-4 rounded-xl bg-secondary hover:bg-white/10 border border-white/5 transition-colors flex flex-col items-center text-center gap-2 text-white"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="font-medium text-sm">Media Gallery</span>
            </Link>
            <Link
              href="/admin/settings"
              className="p-4 rounded-xl bg-secondary hover:bg-white/10 border border-white/5 transition-colors flex flex-col items-center text-center gap-2 text-white"
            >
              <Settings className="w-6 h-6" />
              <span className="font-medium text-sm">Site Settings</span>
            </Link>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}