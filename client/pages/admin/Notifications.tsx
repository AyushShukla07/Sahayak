import { useEffect, useMemo, useState } from "react";
import type { Issue } from "@shared/api";

export default function AdminNotifications(){
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(()=>{ fetch('/api/issues').then(r=>r.json()).then(d=>setIssues(d.issues||[])) },[]);

  const urgent = useMemo(()=> issues.filter(i=> i.status==='escalated' || i.upvotes>10 ), [issues]);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {urgent.length===0 ? (
        <div className="rounded border p-4 text-sm text-muted-foreground">No urgent alerts right now.</div>
      ) : (
        <ul className="grid gap-2">
          {urgent.map(i=> (
            <li key={i.id} className="flex items-center justify-between rounded border p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{i.title}</div>
                <div className="truncate text-xs text-muted-foreground">{i.address}</div>
              </div>
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Urgent</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
