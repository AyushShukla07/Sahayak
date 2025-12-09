import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import type { Issue } from '@shared/api';

export default function AdminAnalytics(){
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(()=>{ fetch('/api/issues').then(r=>r.json()).then(d=>setIssues(d.issues||[])) },[]);

  const byDay = useMemo(()=>{
    const map = new Map<string, number>();
    for(const i of issues){ const d = new Date(i.createdAt).toISOString().slice(0,10); map.set(d, (map.get(d)||0)+1); }
    return Array.from(map.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count}));
  },[issues]);

  const byCategory = useMemo(()=>{
    const map = new Map<string, number>();
    for(const i of issues){ map.set(i.category, (map.get(i.category)||0)+1); }
    return Array.from(map.entries()).map(([category,count])=>({category,count}));
  },[issues]);

  function exportCsv(){
    const rows = ["id,title,category,wardId,status,createdAt,address"]; 
    for(const i of issues){ rows.push([i.id, i.title, i.category, i.wardId, i.status, i.createdAt, JSON.stringify(i.address)].join(',')); }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'issues.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="rounded border px-3 py-2 text-sm">Export CSV</button>
          <button onClick={()=>window.print()} className="rounded border px-3 py-2 text-sm">Print / Save PDF</button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">Issues over time</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <XAxis dataKey="date" hide/>
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">Most reported categories</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
