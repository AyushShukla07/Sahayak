import { useEffect, useMemo, useState } from "react";
import type { Issue } from "@shared/api";

export default function MyResolved() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'user';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/issues');
        const data = await res.json();
        setIssues(data.issues || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myResolved = useMemo(() => issues.filter((i: any) => i.createdBy === uid && i.status === 'resolved'), [issues, uid]);

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Issues Resolved</h1>
      <p className="mt-1 text-sm text-muted-foreground">User: <span className="font-mono">{uid}</span></p>
      <div className="mt-6 grid gap-3">
        {loading && <div className="rounded-md border p-4">Loading…</div>}
        {!loading && myResolved.length === 0 && (
          <div className="rounded-md border p-4 text-muted-foreground">No resolved issues yet.</div>
        )}
        {myResolved.map((i) => (
          <div key={i.id} className="rounded-md border p-4">
            <div className="flex items-center justify-between"><div className="font-semibold">{i.title}</div><span className="text-xs">{i.status}</span></div>
            <p className="text-sm text-muted-foreground">{i.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
