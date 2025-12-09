import { useEffect, useMemo, useState } from "react";
import { MapView } from "@/components/app/MapView";
import type { Issue, StatsResponse } from "@shared/api";

export default function Admin() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetch("/api/issues").then((r) => r.json()).then((d) => setIssues(d.issues));
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const leaders = useMemo(() => {
    const byWard = new Map<string, Issue[]>();
    for (const i of issues) {
      if (!byWard.has(i.wardId)) byWard.set(i.wardId, []);
      byWard.get(i.wardId)!.push(i);
    }
    return Array.from(byWard.entries()).map(([ward, arr]) => {
      const green = arr.filter((i) => i.status === "resolved").length;
      const red = arr.filter((i) => i.status !== "resolved" && i.status !== "in_progress" && i.status !== "under_review").length;
      const yellow = arr.filter((i) => i.status === "in_progress" || i.status === "under_review").length;
      return { ward, green, red, yellow, total: arr.length };
    });
  }, [issues]);

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">City Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Issues Reported Today" value={stats?.issuesReportedToday ?? 0} />
        <StatCard label="Resolved This Month" value={stats?.resolvedThisMonth ?? 0} />
        <StatCard label="Avg. Time to Resolution (hrs)" value={stats?.avgTimeToResolutionHours ?? 0} />
        <StatCard label="Total Active Issues" value={issues.length} />
      </div>

      <div className="mt-8">
        <MapView />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Ward Leader Performance</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l) => (
            <div key={l.ward} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">{l.ward.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground">{l.total} issues</div>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: Math.max(10, l.total || 10) }).map((_, i) => {
                  const color = i < l.green ? "bg-success" : i < l.green + l.yellow ? "bg-warning" : "bg-destructive";
                  return <div key={i} className={`aspect-square rounded ${color}/70`} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
