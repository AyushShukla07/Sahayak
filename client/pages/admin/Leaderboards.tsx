import { useEffect, useMemo, useState } from "react";
import type { Issue } from "@shared/api";

export default function AdminLeaderboards(){
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(()=>{ fetch('/api/issues').then(r=>r.json()).then(d=>setIssues(d.issues||[])) },[]);

  const byReporter = useMemo(()=>{
    const map = new Map<string, number>();
    for(const i of issues){ const u = i.createdBy || 'anonymous'; map.set(u, (map.get(u)||0)+1); }
    return Array.from(map.entries()).map(([user, reports])=>({user, reports})).sort((a,b)=>b.reports-a.reports).slice(0,20);
  },[issues]);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Top Reporters</h1>
      <ol className="grid gap-2">
        {byReporter.map((r, idx)=> (
          <li key={r.user} className="flex items-center gap-3 rounded-md border p-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white font-semibold">{idx+1}</span>
            <div className="min-w-0">
              <div className="truncate font-medium">{r.user}</div>
              <div className="text-xs text-muted-foreground">Reports: {r.reports}</div>
            </div>
            {idx<3 && <span className="ml-auto text-xl">{idx===0?'🥇':idx===1?'🥈':'🥉'}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
