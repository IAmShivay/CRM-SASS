"use client";

import { Card } from "@/components/ui/card";
import { DashboardStat } from "./dashboard-stat";

export function DashboardStats() {
  // Static data simulating leads
  const leads = [
    { status: "in_progress" },
    { status: "closed" },
    { status: "in_progress" },
    { status: "closed" },
    { status: "in_progress" },
  ];

  const stats = [
    {
      title: "Total Leads",
      value: leads.length,
    },
    {
      title: "Active Leads",
      value: leads.filter((lead) => lead.status === "in_progress").length,
    },
    {
      title: "Closed Leads",
      value: leads.filter((lead) => lead.status === "closed").length,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => (
        <DashboardStat key={stat.title} {...stat} />
      ))}
    </div>
  );
}
