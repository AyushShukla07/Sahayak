import { useEffect, useMemo, useState } from "react";
import type { Issue } from "@shared/api";

export default function AdminDepartments(){
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(()=>{ fetch('/api/issues').then(r=>r.json()).then(d=>setIssues(d.issues||[])) },[]);

  const groups = useMemo(()=>{
    const map = new Map<string, Issue[]>();
    for (const i of issues){ if(!map.has(i.wardId)) map.set(i.wardId, []); map.get(i.wardId)!.push(i); }
    return Array.from(map.entries()).map(([dept, arr])=>{
      const solved = arr.filter(i=>i.status==='resolved').length;
      const pending = arr.filter(i=>i.status!=='resolved' && i.status!=='in_progress' && i.status!=='under_review').length;
      const progress = arr.filter(i=>i.status==='in_progress' || i.status==='under_review').length;
      const avgAgeHrs = Math.round(arr.reduce((a,i)=> a + (Date.now()-+new Date(i.createdAt))/36e5, 0) / Math.max(1, arr.length));
      return { dept, solved, pending, progress, total: arr.length, avgAgeHrs };
    })
  },[issues]);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Departments</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(g=> (
          <div key={g.dept} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold">{g.dept.toUpperCase()}</div>
              <div className="text-xs text-muted-foreground">{g.total} issues</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded bg-emerald-100 p-2 text-emerald-800">Solved<br/><span className="text-base font-semibold">{g.solved}</span></div>
              <div className="rounded bg-amber-100 p-2 text-amber-800">In Progress<br/><span className="text-base font-semibold">{g.progress}</span></div>
              <div className="rounded bg-red-100 p-2 text-red-800">Pending<br/><span className="text-base font-semibold">{g.pending}</span></div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Avg age: {g.avgAgeHrs} hrs</div>
            <button className="mt-3 w-full rounded border px-3 py-2 text-sm">Open Department</button>
          </div>
        ))}
      </div>
    </div>
  );
}
