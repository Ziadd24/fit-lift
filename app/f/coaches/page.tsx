"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminCoachesTab } from "@/features/admin/coaches/AdminCoachesTab";

export default function AdminCoachesPage() {
  return (
    <AdminLayout>
      <AdminCoachesTab />
    </AdminLayout>
  );
}