import { useMemo } from "react";

type Leader = { name: string; ward: number; issues: number; resolved: number; pending: number };

const LEADERS: Leader[] = [
  { name: "Anil Kumar", ward: 1, issues: 120, resolved: 100, pending: 20 },
  { name: "Meena Sharma", ward: 2, issues: 95, resolved: 85, pending: 10 },
  { name: "Ravi Singh", ward: 3, issues: 105, resolved: 90, pending: 15 },
  { name: "Sunita Devi", ward: 4, issues: 88, resolved: 70, pending: 18 },
  { name: "Mohan Yadav", ward: 5, issues: 132, resolved: 110, pending: 22 },
  { name: "Pooja Rani", ward: 6, issues: 76, resolved: 60, pending: 16 },
  { name: "Rajesh Gupta", ward: 7, issues: 101, resolved: 92, pending: 9 },
  { name: "Suresh Verma", ward: 8, issues: 67, resolved: 52, pending: 15 },
  { name: "Deepa Sharma", ward: 9, issues: 118, resolved: 98, pending: 20 },
  { name: "Arjun Malhotra", ward: 10, issues: 84, resolved: 60, pending: 24 },
];

function score(l: Leader){ return Math.round((l.resolved / Math.max(1,l.issues)) * 100); }
function badgeClass(s: number){ if(s>=85) return "bg-emerald-100 text-emerald-800"; if(s>=75) return "bg-amber-100 text-amber-800"; return "bg-red-100 text-red-800"; }

export default function WardLeaders(){
  const rows = useMemo(()=> LEADERS.map(l=> ({...l, score: score(l)})).sort((a,b)=>b.score-a.score), []);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Ward Leaders Performance</h1>
      <div className="overflow-auto rounded border">
        <table className="min-w-[800px] w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="p-2">Ward Leader Name</th>
              <th className="p-2">Ward Number</th>
              <th className="p-2">Issues</th>
              <th className="p-2">Resolved</th>
              <th className="p-2">Pending</th>
              <th className="p-2">Performance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(l=> (
              <tr key={l.ward} className="border-t">
                <td className="p-2">{l.name}</td>
                <td className="p-2">Ward {l.ward}</td>
                <td className="p-2">{l.issues}</td>
                <td className="p-2">{l.resolved}</td>
                <td className="p-2">{l.pending}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${badgeClass(l.score)}`}>{l.score}%</span>
                    <div className="h-2 w-40 overflow-hidden rounded bg-muted">
                      <div className="h-full bg-emerald-500" style={{ width: `${l.score}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
