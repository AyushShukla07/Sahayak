import React, { useEffect, useMemo, useState } from "react";
import type { Issue } from "@shared/api";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const out: string[] = [];
  const now = new Date();
  const m = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(m.getFullYear(), m.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}

export function WardLeaderDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch("/api/issues");
        const j = await r.json();
        if (!cancel) setIssues((j.issues || []) as Issue[]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const totals = useMemo(() => {
    const reported = issues.length;
    const resolved = issues.filter((i) => i.status === "resolved").length;
    return { reported, resolved };
  }, [issues]);

  const months12 = useMemo(() => lastNMonths(12), []);
  const monthly = useMemo(() => {
    const map = new Map(months12.map((k) => [k, { month: k, reported: 0, resolved: 0 }]));
    for (const i of issues) {
      const k = monthKey(new Date(i.createdAt));
      if (map.has(k)) {
        map.get(k)!.reported += 1;
        if (i.status === "resolved") map.get(k)!.resolved += 1;
      }
    }
    return months12.map((k) => map.get(k)!);
  }, [issues, months12]);

  const resolutionLine = useMemo(() => monthly.map((m) => ({ month: m.month, pct: m.reported ? Math.round((m.resolved / m.reported) * 100) : 0 })), [monthly]);

  const statusPie = useMemo(() => {
    const open = issues.filter((i) => i.status === 'submitted' || i.status === 'pending_verification' || i.status === 'under_review' || i.status === 'escalated').length;
    const inprog = issues.filter((i) => i.status === 'in_progress').length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;
    return [
      { name: 'Open', value: open, color: 'hsl(var(--info))' },
      { name: 'In Progress', value: inprog, color: 'hsl(var(--warning))' },
      { name: 'Resolved', value: resolved, color: 'hsl(var(--success))' },
    ];
  }, [issues]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-xs text-muted-foreground">Total Issues Reported</div>
          <div className="mt-1 text-3xl font-bold">{totals.reported}</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-xs text-muted-foreground">Issues Resolved</div>
          <div className="mt-1 text-3xl font-bold">{totals.resolved}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status Breakdown Pie */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 text-sm font-semibold">Status Breakdown</div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label>
                  {statusPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance Bar */}
        <div className="rounded-lg border p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Monthly Performance (Reported vs Resolved)</div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="reported" fill="hsl(var(--primary))" name="Reported" radius={[4,4,0,0]} fillOpacity={0.5} />
                <Bar dataKey="resolved" fill="hsl(var(--success))" name="Resolved" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resolution Percentage Line */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-semibold">Resolution Percentage Over Time</div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={resolutionLine} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} tickFormatter={(v)=>`${v}%`} />
              <Tooltip formatter={(v:any)=>`${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="pct" name="Resolution %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default WardLeaderDashboard;
