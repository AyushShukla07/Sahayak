import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CommunityPost, CreateCommunityPostPayload, GalleryCategory } from "@shared/api";

const categories: { value: GalleryCategory; label: string }[] = [
  { value: "park_cleanup", label: "Park Cleanup" },
  { value: "graffiti_removal", label: "Graffiti Removal" },
  { value: "pothole_repair", label: "Pothole Repair" },
  { value: "other", label: "Other" },
];

export default function Gallery() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CommunityPost | null>(null);

  async function load() {
    const r = await fetch("/api/community-posts");
    const j = await r.json();
    setPosts(j.posts || []);
  }

  useEffect(() => { load(); }, []);

  const shown = useMemo(() => posts.filter((p)=> filter === "all" ? true : (p.category || "other") === filter), [posts, filter]);

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Image Gallery</h1>
        <Button onClick={()=>setOpen(true)}>Upload Your Success Story</Button>
      </div>
      <div className="mb-6 flex items-center gap-2">
        <label className="text-sm">Filter:</label>
        <select className="rounded-md border bg-background px-2 py-1 text-sm" value={filter} onChange={(e)=>setFilter(e.target.value as any)}>
          <option value="all">All</option>
          {categories.map((c)=>(<option key={c.value} value={c.value}>{c.label}</option>))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {shown.map((p)=> (
          <button key={p.id} className="group overflow-hidden rounded-md border bg-card text-left" onClick={()=>setPreview(p)}>
            <img src={p.media[0]?.url} alt="Post" className="h-48 w-full object-cover transition-transform group-hover:scale-105" />
            <div className="p-3 text-sm">
              <div className="line-clamp-2">{p.description}</div>
              <div className="mt-1 text-xs text-muted-foreground">{categories.find((c)=>c.value === (p.category||"other"))?.label}</div>
            </div>
          </button>
        ))}
      </div>

      <UploadDialog open={open} onOpenChange={setOpen} onSubmitted={()=>{ setOpen(false); load(); }} />

      {preview && (
        <Dialog open={!!preview} onOpenChange={(v)=>!v && setPreview(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Success Story</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {preview.media.map((m,i)=> (<img key={i} src={m.url} className="w-full rounded-md" alt="media" />))}
              </div>
              <p className="text-sm text-muted-foreground">{preview.description}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function UploadDialog({ open, onOpenChange, onSubmitted }: { open: boolean; onOpenChange: (v: boolean)=>void; onSubmitted: ()=>void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<GalleryCategory>("other");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!desc.trim() || files.length === 0) return;
    setPending(true);
    try {
      const base64s = await Promise.all(Array.from(files).slice(0,2).map((f)=> fileToBase64(f)));
      const uid = JSON.parse(localStorage.getItem("uid") || '"anon"');
      const payload: CreateCommunityPostPayload = { userId: typeof uid === 'string' ? uid : 'anon', description: desc, mediaBase64: base64s, category: cat };
      const r = await fetch('/api/community-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Upload failed');
      onSubmitted();
      setFiles([]); setDesc(""); setCat("other");
    } finally { setPending(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Your Success Story</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <select className="rounded-md border bg-background px-3 py-2" value={cat} onChange={(e)=>setCat(e.target.value as GalleryCategory)}>
            {categories.map((c)=>(<option key={c.value} value={c.value}>{c.label}</option>))}
          </select>
          <textarea className="min-h-24 rounded-md border bg-background px-3 py-2" placeholder="Describe the positive change" value={desc} onChange={(e)=>setDesc(e.target.value)} />
          <input type="file" multiple accept="image/*" onChange={(e)=>setFiles(Array.from(e.target.files || []))} />
          <div className="text-xs text-muted-foreground">You can upload one image or a before-and-after pair.</div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={pending || files.length===0 || !desc.trim()}>{pending ? 'Uploading…' : 'Submit'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function fileToBase64(file: File) { return new Promise<string>((resolve,reject)=>{ const r = new FileReader(); r.onload = ()=> resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); }); }
