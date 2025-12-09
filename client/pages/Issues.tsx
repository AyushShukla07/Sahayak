import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Issue } from "@shared/api";
import { IssueCard } from "@/components/app/IssueCard";

export default function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const uid = (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || `user-${Math.random().toString(36).slice(2,8)}`;

  async function load() {
    try {
      setError(null);
      const res = await fetch('/api/issues');
      const data = await res.json();
      setIssues((data.issues || []) as Issue[]);
    } catch (e) {
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  const wardId = (typeof localStorage !== 'undefined' && localStorage.getItem('wardId')) || 'ward-1';

  const filtered = useMemo(() => {
    if (!view) return issues;
    if (view === 'ward') return issues.filter((i)=> i.wardId === wardId && i.status !== 'resolved');
    if (view === 'verified') return issues.filter((i)=> (i.upvotes || 0) > 0);
    if (view === 'categories') return issues; // full list to explore categories
    return issues;
  }, [issues, view, wardId]);

  async function vote(id: string, v: 1 | -1) {
    try {
      // optimistic update
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, upvotes: (i.upvotes || 0) + (v === 1 ? 1 : 0), downvotes: (i.downvotes || 0) + (v === -1 ? 1 : 0) } : i));
      await fetch(`/api/issues/${id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, vote: v }) });
      load();
    } catch {}
  }

  return (
    <div className="container py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <p className="text-sm text-muted-foreground">Help verify: Is this issue valid?</p>
      </div>
      {view && (
        <div className="mb-4 rounded-md border bg-muted/30 p-3 text-sm">Showing: <strong>{view === 'ward' ? `Your ward (${wardId})` : view === 'verified' ? 'Community verifications' : 'All categories'}</strong> — <a className="underline" href="/issues">Clear</a></div>
      )}
      {loading ? (
        <div className="rounded-md border p-4">Loading…</div>
      ) : error ? (
        <div className="rounded-md border border-destructive p-4 text-destructive">{error}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <div className="col-span-full rounded-md border p-6 text-center text-muted-foreground">No issues to show.</div>
          )}
          {filtered.map((item, idx) => {
            const nodes: React.ReactNode[] = [];
            nodes.push(<IssueCard key={item.id} issue={item} onVote={vote} onComment={() => {}} />);
            // Insert native ad placeholder after every 10 items
            if ((idx + 1) % 10 === 0) {
              nodes.push(
                <div key={`ad-${idx}`} className="col-span-full flex justify-center">
                  <div className="w-full max-w-sm border-2 border-dashed border-gray-300 dark:border-white/30 bg-white/40 p-4 rounded-md text-center text-sm text-muted-foreground">
                    Ad Slot: Inline Native (after 10 reports)
                  </div>
                </div>
              );
            }
            return nodes;
          })}
        </div>
      )}
    </div>
  );
}
