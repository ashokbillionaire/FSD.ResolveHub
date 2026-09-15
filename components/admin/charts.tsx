"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } from "@/types/database";
import type { AdminAnalytics, ComplaintPriority, ComplaintStatus } from "@/types/database";

/** Deliberate, accessible palette — one colour per status/priority. */
const STATUS_COLORS: Record<ComplaintStatus, string> = {
  Submitted: "#94a3b8",
  "Under Review": "#0ea5e9",
  Assigned: "#6366f1",
  "In Progress": "#f59e0b",
  Resolved: "#10b981",
  Closed: "#0d9488",
  Rejected: "#f43f5e",
};

const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  Low: "#94a3b8",
  Medium: "#0ea5e9",
  High: "#f97316",
  Critical: "#f43f5e",
};

const AXIS_STYLE = {
  fontSize: 11,
  fill: "#64748b",
} as const;

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
} as const;

export function StatusPieChart({ analytics }: { analytics: AdminAnalytics }) {
  const data = COMPLAINT_STATUSES.map((status) => ({
    name: status,
    value: analytics.by_status?.[status] ?? 0,
  })).filter((entry) => entry.value > 0);

  if (data.length === 0) {
    return <ChartEmpty message="No complaints have been submitted yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          strokeWidth={1}
          stroke="#ffffff"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_COLORS[entry.name as ComplaintStatus] ?? "#cbd5e1"}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PriorityBarChart({ analytics }: { analytics: AdminAnalytics }) {
  const data = COMPLAINT_PRIORITIES.map((priority) => ({
    name: priority,
    Complaints: analytics.by_priority?.[priority] ?? 0,
    fill: PRIORITY_COLORS[priority],
  }));

  const empty = data.every((entry) => entry.Complaints === 0);
  if (empty) {
    return <ChartEmpty message="No complaints have been submitted yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="Complaints" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ analytics }: { analytics: AdminAnalytics }) {
  const data = (analytics.by_category ?? [])
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((entry) => ({ name: entry.category, Complaints: entry.count }));

  if (data.length === 0) {
    return <ChartEmpty message="No complaints have been submitted yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          width={104}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="Complaints" fill="#4f46e5" radius={[0, 6, 6, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center px-6 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
