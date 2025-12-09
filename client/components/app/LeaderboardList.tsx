import React, { useMemo } from "react";

const leaderboardData = [
  { name: "Sanjay Kumar", reported: 15, votes: 120 },
  { name: "Priya Sharma", reported: 18, votes: 95 },
  { name: "Ajay Singh", reported: 12, votes: 150 },
  { name: "Deepa Menon", reported: 22, votes: 85 },
  { name: "Rahul Gupta", reported: 10, votes: 160 },
  { name: "Anjali Rao", reported: 30, votes: 60 },
  { name: "Vikram Reddy", reported: 8, votes: 175 },
  { name: "Pooja Desai", reported: 14, votes: 110 },
  { name: "Arjun Saini", reported: 19, votes: 90 },
  { name: "Meena Patel", reported: 25, votes: 75 },
];

export function LeaderboardList() {
  const ranked = useMemo(() => {
    return [...leaderboardData]
      .map((m) => ({ ...m, score: m.reported + m.votes }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, []);

  return (
    <ol className="grid gap-2">
      {ranked.map((m, i) => {
        const medal = i === 0 ? { emoji: "🥇", label: "Gold" } : i === 1 ? { emoji: "🥈", label: "Silver" } : i === 2 ? { emoji: "🥉", label: "Bronze" } : null;
        return (
          <li key={m.name} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">{i + 1}</span>
              {medal && (
                <span className="text-lg" aria-label={`${medal.label} medal`} title={`${medal.label} medal`}>{medal.emoji}</span>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">Reported: {m.reported} • Votes: {m.votes}</div>
              </div>
            </div>
            <div className="text-sm font-semibold">Score: {m.reported + m.votes}</div>
          </li>
        );
      })}
    </ol>
  );
}

export default LeaderboardList;
