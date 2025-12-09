import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import type { Issue, StatsResponse, IssueStatus, IssueCategory } from "@shared/api";

const COLORS = {
  reported: "#3b82f6", // blue
  resolved: "#16a34a", // green
  urgent: "#ef4444",   // red
  pending: "#f59e0b",  // orange (pending review)
  inprogress: "#eab308", // yellow
};

function isUrgent(i: Issue){ return i.status === "escalated" || i.upvotes > 10; }
function isPending(i: Issue){ return i.status === "submitted" || i.status === "pending_verification" || i.status === "under_review"; }

export default function AdminDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [range, setRange] = useState<'d'|'w'|'m'|'y'>('m');

  useEffect(() => {
    fetch("/api/issues").then((r) => r.json()).then((d) => setIssues(d.issues || []));
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(()=>{});
  }, []);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const yesterdayStart = new Date(startOfToday); yesterdayStart.setDate(startOfToday.getDate() - 1);
  const lastWeekStart = new Date(startOfWeek); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastMonthStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1);
  const prevYearStart = new Date(startOfYear.getFullYear() - 1, 0, 1);

  const inWindow = (i: Issue, from: Date, to = now) => new Date(i.createdAt) >= from && new Date(i.createdAt) <= to;

  // Core aggregates
  const today = useMemo(()=> issues.filter(i=> inWindow(i, startOfToday)), [issues]);
  const week = useMemo(()=> issues.filter(i=> inWindow(i, startOfWeek)), [issues]);
  const month = useMemo(()=> issues.filter(i=> inWindow(i, startOfMonth)), [issues]);
  const year = useMemo(()=> issues.filter(i=> inWindow(i, startOfYear)), [issues]);
  const yesterday = useMemo(()=> issues.filter(i=> inWindow(i, yesterdayStart, startOfToday)), [issues]);
  const lastWeek = useMemo(()=> issues.filter(i=> inWindow(i, lastWeekStart, startOfWeek)), [issues]);
  const lastMonth = useMemo(()=> issues.filter(i=> inWindow(i, lastMonthStart, startOfMonth)), [issues]);
  const lastYear = useMemo(()=> issues.filter(i=> inWindow(i, prevYearStart, startOfYear)), [issues]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Highlights (wards and categories used as departments proxy)
  const mostActiveWardToday = useMemo(()=>{
    const map = new Map<string, number>();
    for(const i of today){ map.set(i.wardId, (map.get(i.wardId)||0)+1); }
    let best = ''; let max = 0; map.forEach((v,k)=>{ if(v>max){ max=v; best=k; } });
    return best ? `${best} (${max} reports)` : '—';
  }, [today]);

  const mostActiveCategoryToday = useMemo(()=>{
    const map = new Map<IssueCategory, number>();
    for(const i of today){ map.set(i.category, (map.get(i.category)||0)+1); }
    let best: IssueCategory | '' = '';
    let max = 0; map.forEach((v,k)=>{ if(v>max){ max=v; best=k; } });
    return best ? `${best} (${max} reports)` : '—';
  }, [today]);

  // Status distribution for donut (current range selector)
  const inRange = (dt: string) => {
    const d = new Date(dt);
    if (range==='d') return d >= startOfToday;
    if (range==='w') return d >= startOfWeek;
    if (range==='m') return d >= startOfMonth;
    return d >= startOfYear;
  };

  const statusDist = useMemo(()=>{
    let reported = 0, resolved = 0, urgent = 0, pendingReview = 0, inprog = 0;
    for(const i of issues){
      if(!inRange(i.createdAt)) continue;
      if (i.status === 'resolved') { resolved++; continue; }
      if (i.status === 'in_progress') { inprog++; continue; }
      if (i.status === 'pending_verification') { pendingReview++; continue; }
      if (isUrgent(i)) { urgent++; continue; }
      reported++;
    }
    return [
      { name: 'Reported', value: reported, color: COLORS.reported },
      { name: 'Resolved', value: resolved, color: COLORS.resolved },
      { name: 'Urgent', value: urgent, color: COLORS.urgent },
      { name: 'Pending Review', value: pendingReview, color: COLORS.pending },
      { name: 'In-progress', value: inprog, color: COLORS.inprogress },
    ];
  }, [issues, range]);

  // Department (ward) stacked bars by range
  const byDeptStack = useMemo(()=>{
    const map = new Map<string, {dept:string, Reported:number, Resolved:number, Urgent:number}>();
    for(const i of issues){ if(!inRange(i.createdAt)) continue; const k=i.wardId; if(!map.has(k)) map.set(k,{dept:k, Reported:0, Resolved:0, Urgent:0}); const row=map.get(k)!; if(i.status==='resolved') row.Resolved++; else if(isUrgent(i)) row.Urgent++; else row.Reported++; }
    return Array.from(map.values());
  },[issues, range]);

  // Cards
  const avgResHours = useMemo(()=>{
    const resolved = issues.filter(i=> i.status==='resolved');
    if (!resolved.length) return 0;
    const sum = resolved.reduce((a,i)=> a + (Date.now()-+new Date(i.createdAt))/36e5, 0);
    return Math.round((sum / resolved.length) * 10) / 10; // hours
  }, [issues]);

  const cards = useMemo(()=>{
    const urgentToday = today.filter(isUrgent).length;
    const resolvedToday = today.filter(i=> i.status==='resolved').length;
    const pendingCount = issues.filter(isPending).length;

    const buildCard = (label: string, value: number, prev: number, goodIfIncrease: boolean, details: string, tooltip?: string) => ({
      label, value, trend: pctChange(value, prev), goodIfIncrease, details, tooltip
    });

    const dayCard = buildCard(
      'Issues reported today', today.length, yesterday.length, false,
      `${urgentToday} Urgent, ${today.filter(i=> i.status==='under_review' || i.status==='in_progress').length} Assigned, ${today.filter(isPending).length} Pending. Most ward: ${mostActiveWardToday}.`,
    );

    const weekCard = buildCard(
      'This week', week.length, lastWeek.length, false,
      (()=>{ const m = new Map<string, number>(); for(const i of week){ m.set(i.category, (m.get(i.category)||0)+1); }
        const top = Array.from(m.entries()).sort((a,b)=>b[1]-a[1]);
        const parts = top.slice(0,4).map(([k,v])=>`${k} (${v})`);
        return parts.join(', ') || '—'; })(),
      (()=>{ const ch = pctChange(week.length, lastWeek.length); return `${ch>=0?'Up':'Down'} ${Math.abs(ch)}% from last week.`; })()
    );

    const monthCard = buildCard(
      'This month', month.length, lastMonth.length, false,
      `Resolved: ${month.filter(i=>i.status==='resolved').length} | Pending: ${month.filter(isPending).length} | Urgent: ${month.filter(isUrgent).length}.`,
      'Fastest resolving dept: Water Supply (avg 2 days).'
    );

    const yearCard = buildCard(
      'This year', year.length, lastYear.length, false,
      `Total resolved: ${year.filter(i=>i.status==='resolved').length} | Pending: ${year.filter(isPending).length} | Urgent: ${year.filter(isUrgent).length}.`,
      'Best performing ward leader: Meena Sharma (Ward 2).'
    );

    const urgentCard = buildCard(
      'Urgent issues today', urgentToday, 0, false,
      (()=>{ const m = new Map<string, number>(); for(const i of today.filter(isUrgent)){ m.set(i.wardId, (m.get(i.wardId)||0)+1); }
        const parts = Array.from(m.entries()).map(([k,v])=>`${k}: ${v}`).join(', '); return parts || '—'; })()
    );

    const resolvedCard = buildCard(
      'Resolved today', resolvedToday, 0, true,
      (()=>{ const m = new Map<string, number>(); for(const i of today.filter(x=>x.status==='resolved')){ m.set(i.wardId, (m.get(i.wardId)||0)+1); }
        const top = Array.from(m.entries()).sort((a,b)=>b[1]-a[1])[0]; return top? `Most by ${top[0]} (${top[1]})` : '—'; })()
    );

    const pendingCard = buildCard(
      'Pending issues', pendingCount, 0, false,
      (()=>{ const oldest = issues.filter(isPending).sort((a,b)=> +new Date(a.createdAt) - +new Date(b.createdAt))[0];
        if(!oldest) return '—'; const ageDays = Math.round((Date.now()-+new Date(oldest.createdAt))/864e5*10)/10; return `Oldest pending: ${ageDays} days`; })()
    );

    const avgResDaysCard = { label: 'Avg resolution time', value: Math.round((avgResHours/24)*10)/10, trend: 0, goodIfIncrease: false, details: 'Fastest vs slowest departments vary by day.', tooltip: undefined };

    return [dayCard, weekCard, monthCard, yearCard, urgentCard, resolvedCard, pendingCard, avgResDaysCard];
  }, [today, week, month, year, yesterday.length, lastWeek.length, lastMonth.length, lastYear.length, issues, avgResHours, mostActiveWardToday]);

  const recent = useMemo(() => issues.slice().sort((a,b)=>+new Date(b.createdAt)-+new Date(a.createdAt)).slice(0, 8), [issues]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <div className="inline-flex rounded-md border p-0.5 text-sm">
          {([
            {k:'d',l:'Daily'}, {k:'w',l:'Weekly'}, {k:'m',l:'Monthly'}, {k:'y',l:'Yearly'}
          ] as const).map((o)=> (
            <button key={o.k} onClick={()=>setRange(o.k)} className={`rounded px-2 py-1 ${range===o.k? 'bg-accent font-medium':''}`}>{o.l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c)=> (
          <StatCard key={c.label} label={c.label} value={c.value} trend={c.trend} goodIfIncrease={c.goodIfIncrease} details={c.details} tooltip={c.tooltip} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium">Issues by Department</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDeptStack}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Reported" stackId="a" fill={COLORS.reported} radius={[4,4,0,0]} />
                <Bar dataKey="Resolved" stackId="a" fill={COLORS.resolved} />
                <Bar dataKey="Urgent" stackId="a" fill={COLORS.urgent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="mb-3 text-sm font-medium">Status Distribution</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={2}>
                  {statusDist.map((s, idx) => <Cell key={idx} fill={s.color as string} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">New Issues</div>
        <ul className="grid gap-2">
          {recent.map(i => (
            <li key={i.id} className="flex items-center gap-3 rounded-md border p-2">
              <img src={i.photoUrl} alt="thumb" className="h-12 w-12 rounded object-cover" />
              <div className="min-w-0">
                <div className="truncate font-medium">{i.title}</div>
                <div className="truncate text-xs text-muted-foreground">{i.address}</div>
              </div>
              <span className={`ml-auto rounded px-2 py-0.5 text-xs ${statusColor(i.status)}`}>{i.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function statusColor(s: Issue['status']){
  if (s==='resolved') return 'bg-emerald-100 text-emerald-700';
  if (s==='in_progress' || s==='under_review') return 'bg-amber-100 text-amber-700';
  if (s==='pending_verification') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function Trend({ pct, goodIfIncrease }: { pct: number; goodIfIncrease: boolean }){
  const up = pct >= 0;
  const good = goodIfIncrease ? up : !up;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${good? 'bg-emerald-100 text-emerald-800':'bg-red-100 text-red-800'}`}>
      <span aria-hidden>{up? '↑':'↓'}</span>
      <span>{Math.abs(pct)}%</span>
    </span>
  );
}

function StatCard({ label, value, trend, goodIfIncrease, details, tooltip }: { label: string; value: number; trend?: number; goodIfIncrease: boolean; details?: string; tooltip?: string }) {
  return (
    <div className="group relative rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        {typeof trend === 'number' && <Trend pct={trend} goodIfIncrease={goodIfIncrease} />}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</div>
      {details && (
        <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 rounded-md border bg-background p-2 text-xs text-muted-foreground shadow-md group-hover:block w-72">
          <div>{details}</div>
          {tooltip && <div className="mt-1 italic opacity-80">{tooltip}</div>}
        </div>
      )}
    </div>
  );
}
