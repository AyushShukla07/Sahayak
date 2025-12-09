import { useMemo, useState } from "react";

interface LocalContribution {
  id: string;
  userId: string;
  tag: string;
  story: string;
  beforeUrl: string;
  afterUrl: string;
  upvotes: number;
}

const SEED: LocalContribution[] = [
  {
    id: "c1",
    userId: "user-parkcrew",
    tag: "Garbage Overflow",
    story:
      "The municipal garbage service hadn't come for days, so our neighborhood got together last Saturday. We filled 10 bags and took them to the main collection point. It's a small effort, but our street looks much better now!",
    beforeUrl: "/placeholder.svg",
    afterUrl: "/placeholder.svg",
    upvotes: 12,
  },
  {
    id: "c2",
    userId: "user-streetsign",
    tag: "Streetlight/Sign",
    story:
      "After reporting the broken street sign three times, I decided to take matters into my own hands. I bought some paint and wood from a local shop and made a new one myself. It's not perfect, but at least people can find our street now!",
    beforeUrl: "/placeholder.svg",
    afterUrl: "/placeholder.svg",
    upvotes: 7,
  },
];

export default function Contributions() {
  const [items, setItems] = useState<LocalContribution[]>(SEED);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.story.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q) || i.userId.toLowerCase().includes(q));
  }, [items, search]);

  function upvote(id: string) {
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, upvotes: x.upvotes + 1 } : x)));
  }

  return (
    <div className="container py-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Community</h1>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search stories, tags, users" className="h-10 w-full max-w-sm rounded-md border bg-background px-3 text-sm" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <ContributionCard key={c.id} item={c} onUpvote={() => upvote(c.id)} />
        ))}
        {filtered.length === 0 && <div className="rounded-md border p-6 text-center text-muted-foreground">No contributions yet.</div>}
      </div>
    </div>
  );
}

function ContributionCard({ item, onUpvote }: { item: LocalContribution; onUpvote: () => void }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">By <span className="font-mono">{item.userId}</span></div>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{item.tag}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Before</div>
          <img src={item.beforeUrl} alt="Before" className="aspect-video w-full rounded object-cover" />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">After</div>
          <img src={item.afterUrl} alt="After" className="aspect-video w-full rounded object-cover" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{item.story}</p>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={onUpvote} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">👍 Upvote ({item.upvotes})</button>
        <div className="text-xs text-muted-foreground">Inspires action</div>
      </div>
    </div>
  );
}
