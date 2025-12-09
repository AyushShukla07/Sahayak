/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";

const app = getApps().length ? getApps()[0] : initializeApp(globalThis.__firebase_config || {});
const db = getFirestore(app);

function useUserId() {
  const [uid, setUid] = useState(() => localStorage.getItem("admin_uid") || `${__app_id || "admin"}-${Math.random().toString(36).slice(2, 9)}`);
  useEffect(() => localStorage.setItem("admin_uid", uid), [uid]);
  return { uid, setUid };
}

function useHighContrast() {
  const [hc, setHc] = useState(() => localStorage.getItem("hc") === "1");
  useEffect(() => {
    const root = document.documentElement;
    if (hc) root.classList.add("hc"); else root.classList.remove("hc");
    localStorage.setItem("hc", hc ? "1" : "0");
  }, [hc]);
  return { hc, setHc };
}

export default function SahayakAdminPortal() {
  const [view, setView] = useState("public");
  const [reports, setReports] = useState([]);
  const { uid } = useUserId();
  const { hc, setHc } = useHighContrast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setReports(snap.docs.map((d)=>({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const kpis = useMemo(() => {
    const total = reports.length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resolvedThisMonth = reports.filter((r)=>r.status === "resolved" && (r.resolvedAt?.toDate?.() || new Date()) >= monthStart).length;
    const avgHours = reports.length ? Math.round(reports.reduce((a,r)=> a + ((Date.now() - (r.createdAt?.toDate?.().getTime?.() || Date.now()))/36e5), 0)/reports.length) : 0;
    return { total, resolvedThisMonth, avgHours };
  }, [reports]);

  function logout() {
    localStorage.removeItem("admin_uid");
    localStorage.removeItem("hc");
    location.reload();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold"><span className="rounded bg-primary px-2 py-1 text-primary-foreground">Sahayak</span><span>Admin Portal</span></div>
          <div className="flex items-center gap-2" ref={menuRef}>
            <button className={`rounded-md px-3 py-1 ${view==='public'?'bg-primary text-primary-foreground':'border'}`} onClick={()=>setView('public')}>Public</button>
            <button className={`rounded-md px-3 py-1 ${view==='leader'?'bg-primary text-primary-foreground':'border'}`} onClick={()=>setView('leader')}>Ward Leader</button>
            <button aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground" title={uid}>{uid}</button>
            {menuOpen && (
              <div role="menu" className="absolute right-4 top-12 z-50 w-56 rounded-md border bg-background p-1 shadow-md">
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={()=>{setProfileOpen(true); setMenuOpen(false);}}>Profile</button>
                <button role="menuitem" className="flex w-full items-center justify-between rounded px-3 py-2 hover:bg-accent" onClick={()=>setHc(!hc)}>
                  <span>High Contrast</span>
                  <span className={`ml-2 rounded px-2 py-0.5 text-xs ${hc? 'bg-emerald-600 text-white':'bg-muted text-foreground'}`}>{hc? 'ON':'OFF'}</span>
                </button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left text-destructive hover:bg-accent" onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === 'public' ? <PublicDashboard reports={reports} kpis={kpis} /> : <LeaderDashboard reports={reports} />}
      </main>

      {profileOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setProfileOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profile</h3>
              <button className="rounded px-2 py-1 text-sm hover:bg-muted" onClick={()=>setProfileOpen(false)}>✕</button>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="text-muted-foreground">User ID</div>
              <div className="font-mono">{uid}</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Total Issues</div><div className="text-xl font-semibold">{kpis.total}</div></div>
                <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Resolved This Month</div><div className="text-xl font-semibold">{kpis.resolvedThisMonth}</div></div>
                <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">Avg Hours</div><div className="text-xl font-semibold">{kpis.avgHours}</div></div>
              </div>
            </div>
            <div className="mt-4 text-right"><button className="rounded-md border px-3 py-2" onClick={()=>setProfileOpen(false)}>OK</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ children }) { return <div className="rounded-lg border p-4">{children}</div>; }

function PublicDashboard({ reports, kpis }) {
  const byWard = useMemo(() => {
    const map = new Map();
    for (const r of reports) { const w = r.wardId || 'ward-1'; map.set(w, (map.get(w)||0)+1); }
    return Array.from(map.entries());
  }, [reports]);

  return (
    <div>
      <h1 className="text-2xl font-bold">City Performance</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><div className="text-sm text-muted-foreground">Total Issues Reported</div><div className="mt-1 text-2xl font-semibold">{kpis.total}</div></Card>
        <Card><div className="text-sm text-muted-foreground">Issues Resolved This Month</div><div className="mt-1 text-2xl font-semibold">{kpis.resolvedThisMonth}</div></Card>
        <Card><div className="text-sm text-muted-foreground">Average Resolution Time (hrs)</div><div className="mt-1 text-2xl font-semibold">{kpis.avgHours}</div></Card>
      </div>

      <div className="mt-8">
        <div className="rounded-xl border p-4">
          <div className="mb-3 font-semibold">City Map (simulated)</div>
          <div className="relative h-64 w-full rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-4">
              {byWard.map(([ward, count]) => (
                <div key={ward} className="rounded-md bg-white/80 px-3 py-2 text-sm shadow">{ward.toUpperCase()}: {count}</div>
              ))}
              {byWard.length===0 && <div className="rounded-md bg-white/80 px-3 py-2 text-sm shadow">No data</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderDashboard({ reports }) {
  const [filter, setFilter] = useState('unresolved');
  const myWard = 'ward-1';
  const filtered = useMemo(() => {
    return reports.filter((r)=> (r.wardId||'ward-1')===myWard).filter((r)=>{
      if (filter==='unresolved') return r.status !== 'resolved';
      if (filter==='nearing') return nearingSLA(r) >= 0.5 && nearingSLA(r) < 0.8 && r.status !== 'resolved';
      if (filter==='transferred') return r.status === 'escalated';
      if (filter==='resolved') return r.status === 'resolved';
      return true;
    });
  }, [reports, filter]);

  const gridData = useMemo(() => {
    const byStatus = { green: 0, red: 0, yellow: 0 };
    for (const r of reports.filter((x)=> (x.wardId||'ward-1')===myWard)) {
      if (r.status === 'resolved') byStatus.green++; else if (r.status === 'escalated') byStatus.yellow++; else byStatus.red++;
    }
    return byStatus;
  }, [reports]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ward Leader Dashboard</h1>
        <div className="flex gap-2">
          <button className={`rounded-md px-3 py-1 ${filter==='unresolved'?'bg-primary text-primary-foreground':'border'}`} onClick={()=>setFilter('unresolved')}>My Unresolved Issues</button>
          <button className={`rounded-md px-3 py-1 ${filter==='nearing'?'bg-primary text-primary-foreground':'border'}`} onClick={()=>setFilter('nearing')}>Issues Nearing SLA</button>
          <button className={`rounded-md px-3 py-1 ${filter==='transferred'?'bg-primary text-primary-foreground':'border'}`} onClick={()=>setFilter('transferred')}>Transferred to Me</button>
          <button className={`rounded-md px-3 py-1 ${filter==='resolved'?'bg-primary text-primary-foreground':'border'}`} onClick={()=>setFilter('resolved')}>Resolved Issues</button>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-2 font-semibold">Ward Map (simulated)</div>
        <div className="relative h-64 w-full rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.35),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(248,113,113,0.35),transparent_45%)]" />
          <div className="absolute right-3 top-3 rounded-md bg-white/80 px-2 py-1 text-xs shadow">Heatmap overlay</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 font-semibold">Ward Performance</div>
          <Grid data={gridData} />
        </Card>
        <Card>
          <div className="mb-2 font-semibold">Unresolved Issues</div>
          <div className="grid gap-2">
            {filtered.filter((r)=>r.status!=='resolved').map((r)=> (
              <SLAItem key={r.id} issue={r} />
            ))}
            {filtered.filter((r)=>r.status!=='resolved').length===0 && <div className="text-sm text-muted-foreground">No items</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Grid({ data }) {
  const total = Math.max(12, data.green + data.red + data.yellow);
  return (
    <div className="grid grid-cols-6 gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const color = i < data.green ? 'bg-emerald-500' : i < data.green + data.yellow ? 'bg-yellow-400' : 'bg-red-500';
        return <div key={i} className={`aspect-square rounded ${color}`} />;
      })}
    </div>
  );
}

function SLAItem({ issue }) {
  const p = nearingSLA(issue);
  const color = p >= 0.8 ? 'bg-red-50 border-red-200' : p >= 0.5 ? 'bg-amber-50 border-amber-200' : 'bg-white';
  const label = p >= 0.8 ? '80% of SLA reached' : p >= 0.5 ? '50% of SLA reached' : 'On track';
  return (
    <div className={`rounded-md border p-3 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="font-medium">{issue.title || issue.category}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-muted">
        <div className={`h-2 rounded ${p>=0.8?'bg-red-500':p>=0.5?'bg-amber-500':'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.round(p*100))}%` }} />
      </div>
    </div>
  );
}

function nearingSLA(issue) {
  const hours = { Pothole: 24*14, "Streetlight Out": 72, Garbage: 48, Graffiti: 24*7, Other: 24*10 }[issue.category] || 72;
  const created = issue.createdAt?.toDate?.() ? issue.createdAt.toDate().getTime() : Date.now();
  const elapsed = (Date.now() - created) / 36e5;
  return Math.min(0.999, elapsed / hours);
}
