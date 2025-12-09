import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/departments", label: "Departments" },
  { to: "/admin/issues", label: "Issues" },
  { to: "/admin/leaderboards", label: "Leaderboards" },
  { to: "/admin/ward-leaders", label: "Ward Leaders Performance" },
  { to: "/admin/analytics", label: "Analytics & Reports" },
  { to: "/admin/notifications", label: "Notifications" },
  { to: "/admin/users", label: "Admin Management" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r bg-white/80 backdrop-blur transition-transform md:static md:translate-x-0 dark:bg-background ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="text-base font-semibold">Sahayak Admin</div>
            <button aria-label="Close" className="md:hidden rounded-md border px-2 py-1 text-xs" onClick={()=>setOpen(false)}>Close</button>
          </div>
          <nav className="grid gap-0.5 p-2">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end as any}
                onClick={()=>setOpen(false)}
                className={({ isActive }) => `rounded-md px-3 py-2 text-sm hover:bg-accent ${isActive ? 'bg-accent font-medium' : ''}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="md:ml-0">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/70 px-3 backdrop-blur dark:bg-background">
            <div className="flex items-center gap-2">
              <button aria-label="Menu" onClick={()=>setOpen(v=>!v)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border md:hidden">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M4 7h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
              </button>
              <div className="text-sm text-muted-foreground hidden sm:block">{pathname}</div>
            </div>
            <div className="flex items-center gap-2 pr-1">
              <a href="/" className="rounded-md border px-2 py-1 text-xs hover:bg-accent">Public</a>
            </div>
          </header>
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
