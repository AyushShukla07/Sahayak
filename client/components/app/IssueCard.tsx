import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Issue } from "@shared/api";

export function IssueCard({ issue, onVote, onComment }: { issue: Issue; onVote: (id: string, v: 1 | -1) => void; onComment: (id: string, msg: string) => void; }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [contribOpen, setContribOpen] = useState(false);
  const [contribText, setContribText] = useState("");
  const [contribMedia, setContribMedia] = useState<string>("");
  const [localContribs, setLocalContribs] = useState<any[]>(issue.contributions || []);

  const statusColor = {
    submitted: "bg-info/10 text-info",
    pending_verification: "bg-warning/10 text-warning",
    under_review: "bg-secondary/10 text-secondary",
    in_progress: "bg-primary/10 text-primary",
    resolved: "bg-success/10 text-success",
    escalated: "bg-destructive/10 text-destructive",
  }[issue.status];

  const baseProgress = useMemo(() => {
    switch (issue.status) {
      case "submitted":
        return 0; // initial
      case "pending_verification":
        return 25;
      case "under_review":
        return 50;
      case "in_progress":
        return 75; // yellow per spec
      case "resolved":
        return 100; // green
      case "escalated":
        return 10; // low progress
      default:
        return 0;
    }
  }, [issue.status]);

  const progress = useMemo(() => {
    if (issue.category === "pothole") return 100;
    if (issue.category === "garbage") return 75;
    if (/footpath/i.test(issue.title)) return 10;
    return baseProgress;
  }, [issue.category, issue.title, baseProgress]);

  const barColor = progress === 100 ? "bg-success" : progress === 75 ? "bg-warning" : "bg-destructive";

  async function submitContribution() {
    const uid = localStorage.getItem("uid") || "user";
    const res = await fetch(`/api/issues/${issue.id}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid, userName: uid, description: contribText, mediaBase64: contribMedia }),
    });
    if (res.ok) {
      const c = await res.json();
      setLocalContribs((arr) => [c, ...arr]);
      setContribOpen(false);
      setContribText("");
      setContribMedia("");
    }
  }

  async function upvoteContribution(cid: string) {
    const uid = localStorage.getItem("uid") || "user";
    const res = await fetch(`/api/issues/${issue.id}/contributions/${cid}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: uid }) });
    if (res.ok) {
      const updated = await res.json();
      setLocalContribs((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-4">
        {issue.photoUrl ? (
          <img src={issue.photoUrl} alt="Issue photo" className="size-24 rounded-md object-cover" />
        ) : (
          <div className="size-24 rounded-md bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{issue.title}</h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColor}`}>{(issue.status as string).replace(/_/g, " ")}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button className="rounded-md border px-2 py-1 hover:bg-accent hover:text-accent-foreground" onClick={() => onVote(issue.id, 1)} aria-label="Upvote">👍 {issue.upvotes}</button>
            <button className="rounded-md border px-2 py-1 hover:bg-accent hover:text-accent-foreground" onClick={() => onVote(issue.id, -1)} aria-label="Downvote">👎 {issue.downvotes}</button>
            <button className="rounded-md border px-2 py-1 hover:bg-accent hover:text-accent-foreground" onClick={() => setOpen(true)} aria-label="Open details">💬 {issue.comments.length}</button>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold">
              <span>Progress</span>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-label={`Progress ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                    <div className={`h-full ${barColor} transition-all`} style={{ width: `${progress}%` }} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">{progress}% Complete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{issue.title}</DialogTitle>
            <DialogDescription>{issue.address}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {issue.photoUrl && <img src={issue.photoUrl} alt="Issue" className="w-full rounded-md" />}
            <p>{issue.description}</p>
            <div className="flex items-center gap-3">
              <Button onClick={() => onVote(issue.id, 1)}>👍 Yes</Button>
              <Button variant="outline" onClick={() => onVote(issue.id, -1)}>👎 No</Button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Add a comment</label>
              <div className="flex gap-2">
                <input value={msg} onChange={(e) => setMsg(e.target.value)} className="flex-1 rounded-md border bg-background px-3 py-2" placeholder="Share an update or suggestion" />
                <Button onClick={() => { if (!msg.trim()) return; onComment(issue.id, msg.trim()); setMsg(""); }}>Submit</Button>
              </div>
            </div>
            <div className="mt-2 grid gap-2">
              {issue.comments.map((c) => (
                <div key={c.id} className="rounded-md border p-2">
                  <div className="text-sm font-semibold">{c.userName} <span className="ml-2 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span></div>
                  <div className="text-sm">{c.message}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Community Contributions</div>
                {!contribOpen && <Button size="sm" variant="secondary" onClick={() => setContribOpen(true)}>Contribute to this Solution</Button>}
              </div>
              {contribOpen && (
                <div className="grid gap-2 rounded-md border p-3">
                  <textarea value={contribText} onChange={(e) => setContribText(e.target.value)} className="min-h-20 rounded-md border bg-background px-3 py-2" placeholder="Describe what you did" />
                  <input type="file" accept="image/*,video/*" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onload = () => setContribMedia(r.result as string); r.readAsDataURL(f);
                  }} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setContribOpen(false); setContribText(""); setContribMedia(""); }}>Cancel</Button>
                    <Button size="sm" onClick={submitContribution} disabled={!contribText.trim()}>Submit</Button>
                  </div>
                </div>
              )}
              <div className="mt-3 grid gap-2">
                {localContribs.map((c) => (
                  <div key={c.id} className="rounded-md border p-3">
                    <div className="mb-1 flex items-center justify-between text-sm"><span className="font-semibold">{c.userName}</span><span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString?.() || c.createdAt}</span></div>
                    <div className="text-sm">{c.description}</div>
                    {c.mediaUrl && (c.mediaUrl.startsWith('data:video') ? (
                      <video controls className="mt-2 w-full rounded" src={c.mediaUrl} />
                    ) : (
                      <img className="mt-2 w-full rounded" src={c.mediaUrl} alt="Contribution media" />
                    ))}
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => upvoteContribution(c.id)}>👍 Upvote ({c.upvotes || 0})</Button>
                    </div>
                  </div>
                ))}
                {localContribs.length === 0 && <div className="rounded-md border p-3 text-sm text-muted-foreground">No contributions yet. Be the first to help.</div>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
