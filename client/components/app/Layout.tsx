import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getDefaultLocale, t, type Locale } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileManager } from "@/components/app/ProfileManager";
import { BrandLogo } from "@/components/app/BrandLogo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { safeFetchJson } from "@/lib/api";
import { ReportFlow } from "@/components/app/ReportFlow";
import { LeaderboardList } from "@/components/app/LeaderboardList";
import { WardLeaderDashboard } from "@/components/app/WardLeaderDashboard";

export function Layout({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useLocalStorage<Locale>("locale", getDefaultLocale());
  const [hc, setHc] = useLocalStorage<boolean>("hc", false);
  const [uid, setUid] = useLocalStorage<string>("uid", "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<{ id: string; kind: 'issue' | 'event'; title: string; meta?: string; href?: string; at: string }[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderPerfOpen, setLeaderPerfOpen] = useState(false);
  const [userPageReady, setUserPageReady] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (hc) root.classList.add("hc"); else root.classList.remove("hc");
  }, [hc]);

  useEffect(() => {
    function onReady(){ setUserPageReady(true); }
    function onUnready(){ setUserPageReady(false); }
    window.addEventListener('userpage_ready', onReady);
    window.addEventListener('userpage_unready', onUnready);
    try { setUserPageReady(sessionStorage.getItem('userpage_ready') === '1'); } catch {}
    return () => {
      window.removeEventListener('userpage_ready', onReady);
      window.removeEventListener('userpage_unready', onUnready);
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const lower = pathname.toLowerCase();
    if (lower.startsWith('/admin')) return;
    let cancel = false;
    async function fetchCount() {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      try {
        const ji = await safeFetchJson<{ issues: any[] }>("/api/issues", undefined, { issues: [] });
        const je = await safeFetchJson<{ events: any[] }>("/api/community-events", undefined, { events: [] });
        const issues: any[] = (ji?.issues || []);
        const events: any[] = (je?.events || []);
        const issueItems = issues
          .filter((i:any)=> i.status === 'submitted' || i.status === 'pending_verification')
          .map((i:any) => ({ id: i.id, kind: 'issue' as const, title: i.title, meta: i.status === 'submitted' ? 'Needs verification' : 'Pending verification', href: '/issues', at: i.createdAt }));
        const eventItems = events
          .map((e:any) => ({ id: e.id, kind: 'event' as const, title: e.title, meta: `${new Date(e.startsAt).toLocaleDateString()} • ${e.location}`, href: '/contributions', at: e.startsAt }));
        const items = [...issueItems, ...eventItems]
          .sort((a,b)=> +new Date(b.at) - +new Date(a.at));
        if (!cancel) {
          setNotifItems(items);
          setNotifCount(issueItems.length + eventItems.length);
        }
      } catch {}
    }
    fetchCount();
    const id = setInterval(fetchCount, 10000);
    return () => { cancel = true; clearInterval(id); };
  }, [pathname]);

  useEffect(() => {
    function handleHash() {
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const lower = pathname.toLowerCase();
  const showChrome = !(lower === "/" || lower.startsWith("/signup") || lower.startsWith("/otp") || lower.startsWith("/admin"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showChrome && (
      <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background">
        <div className="container flex h-16 items-center justify-between pl-2.5 pr-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BrandLogo />
            <span>Sahayak</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/UserPage" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Home</NavLink>
              <NavLink to="/issues" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Issues</NavLink>
              <NavLink to="/contributions" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Community</NavLink>
              <NavLink to="/gallery" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Image Gallery</NavLink>
              {pathname === '/UserPage' && (
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setLeaderPerfOpen(v=>!v)} aria-haspopup="dialog" aria-expanded={leaderPerfOpen}>Ward Leader Progress</button>
              )}
          </nav>
          <div className="relative flex items-center gap-2 sm:gap-3" ref={menuRef}>
            {/* Notifications */}
            <div className="relative">
              <button aria-haspopup="dialog" aria-expanded={notifOpen} onClick={() => setNotifOpen(v => !v)} className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent ml-2 sm:ml-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 2a6 6 0 0 0-6 6v3.1l-1.6 3.2A1 1 0 0 0 5.3 16H19a1 1 0 0 0 .9-1.5L18 11.1V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z"/></svg>
                {notifCount > 0 && (<span className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">{notifCount}</span>)}
              </button>
            </div>

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label={t(locale, 'language')} className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent">
                  <Languages className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'bn', label: '���াংলা' },
                  { code: 'mr', label: 'मराठी' },
                  { code: 'te', label: 'తెలుగు' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'gu', label: 'ગુજરાતી' },
                  { code: 'ur', label: 'اردو' },
                  { code: 'kn', label: 'ಕನ್ನಡ' },
                  { code: 'or', label: 'ଓଡ଼ି���' },
                  { code: 'ml', label: 'മലയാളം' },
                  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
                ].map(opt => (
                  <DropdownMenuItem key={opt.code} onClick={() => setLocale(opt.code as Locale)} className={locale === (opt.code as Locale) ? 'font-medium text-primary' : ''}>
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(() => { const displayName = pathname === '/UserPage' ? 'Ayush' : (uid || 'You'); return (
              <button aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 hover:bg-accent">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {displayName[0]?.toUpperCase()}
                </span>
                <span className="max-w-[10ch] truncate text-sm">{displayName}</span>
              </button> ); })()}
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-12 z-50 w-64 rounded-md border bg-background p-1 shadow-md">
                <div className="flex items-center gap-2 rounded px-3 py-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">{(pathname === '/UserPage' ? 'Ayush' : (uid || 'User'))[0]?.toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{pathname === '/UserPage' ? 'Ayush' : (uid || 'User')}</div>
                    <div className="text-xs text-muted-foreground">Signed in</div>
                  </div>
                </div>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={() => { setProfileOpen(true); setMenuOpen(false); }}>Profile</button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={() => { navigate('/my-issues'); setMenuOpen(false); }}>Issues Reported</button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={() => { navigate('/my-resolved'); setMenuOpen(false); }}>Issues Resolved</button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={() => { navigate('/contributions'); setMenuOpen(false); }}>Contributions</button>
                {pathname === '/UserPage' && (
                  <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={() => { setLeaderboardOpen(true); setMenuOpen(false); }}>Leaderboard</button>
                )}
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={() => { navigate('/settings'); setMenuOpen(false); }}>Settings</button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left text-destructive hover:bg-accent" onClick={() => { try{ localStorage.clear(); sessionStorage.clear(); }catch{} navigate('/'); }}>Logout</button>
              </div>
            )}
            <button aria-label="Open menu" className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent md:hidden" onClick={() => setMobileNavOpen(v=>!v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      )}
      <main>{children}</main>

      {showChrome && mobileNavOpen && (
        <div className="fixed inset-x-0 top-16 z-50 border-b bg-background md:hidden">
          <nav className="grid gap-1 p-3">
            <NavLink to="/UserPage" onClick={()=>setMobileNavOpen(false)} className={({isActive})=>`rounded px-3 py-2 ${isActive? 'bg-accent' : 'hover:bg-accent'}`}>Home</NavLink>
            <NavLink to="/contributions" onClick={()=>setMobileNavOpen(false)} className={({isActive})=>`rounded px-3 py-2 ${isActive? 'bg-accent' : 'hover:bg-accent'}`}>Community</NavLink>
            <NavLink to="/issues" onClick={()=>setMobileNavOpen(false)} className={({isActive})=>`rounded px-3 py-2 ${isActive? 'bg-accent' : 'hover:bg-accent'}`}>Issues</NavLink>
            <NavLink to="/gallery" onClick={()=>setMobileNavOpen(false)} className={({isActive})=>`rounded px-3 py-2 ${isActive? 'bg-accent' : 'hover:bg-accent'}`}>Image Gallery</NavLink>
            {pathname === '/UserPage' && (
              <button className="rounded px-3 py-2 text-left hover:bg-accent" aria-haspopup="dialog" aria-expanded={leaderPerfOpen} onClick={()=>{ setLeaderPerfOpen(v=>!v); setMobileNavOpen(false); }}>Ward Leader Progress</button>
            )}
          </nav>
        </div>
      )}

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-lg w-[92vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          {notifItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
          ) : (
            <ul className="grid gap-2">
              {notifItems.map((n) => (
                <li key={`${n.kind}-${n.id}`}>
                  <a href={n.href} className="block rounded-md border p-3 hover:bg-accent">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${n.kind === 'issue' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{n.kind === 'issue' ? 'Issue' : 'Event'}</span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{n.title}</div>
                        {n.meta && <div className="truncate text-xs text-muted-foreground">{n.meta}</div>}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Leaderboard Overlay */}
      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogContent className="sm:max-w-xl w-[92vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top Contributors in Your Ward</DialogTitle>
          </DialogHeader>
          <LeaderboardList />
        </DialogContent>
      </Dialog>

      {/* Ward Leader Performance Dashboard */}
      <Dialog open={leaderPerfOpen} onOpenChange={setLeaderPerfOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ward Leader Performance Dashboard</DialogTitle>
          </DialogHeader>
          <WardLeaderDashboard />
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <ProfileManager uid={uid} />
        </DialogContent>
      </Dialog>
      {pathname === '/UserPage' && userPageReady && (<ReportFlow onCreated={() => {}} />)}
      {/* Native ad near footer for homepage only */}
      {lower === '/' && (
        <>
          <div className="container py-6">
            <div className="mx-auto max-w-6xl">
              <div className="border-2 border-dashed border-gray-300 dark:border-white/30 bg-white/40 p-4 rounded-md text-center text-sm text-muted-foreground">
                Ad Slot: Native (responsive card)
              </div>
            </div>
          </div>

          {/* Services section (homepage) */}
          <div className="container py-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-6 text-[28px] md:text-[32px] font-semibold text-center text-white"><span style={{ color: 'rgb(0,0,0)' }}>Our Services</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { id: 'pay-house-tax', title: 'Pay House Tax Online' },
                  { id: 'pay-water-tax', title: 'Pay Water Tax Online' },
                  { id: 'birth-cert', title: 'Apply for Birth Certificate' },
                  { id: 'death-cert', title: 'Apply for Death Certificate' },
                  { id: 'lodge-complaint', title: 'Lodge a Complaint (Civic Issues)' },
                  { id: 'track-complaint', title: 'Track Complaint Status' },
                  { id: 'book-hall', title: 'Book Community Hall / Ground' },
                ].map((s) => (
                  <a
                    key={s.id}
                    href={`/services#${s.id}`}
                    className="group block p-6 min-h-[88px] flex items-center justify-center text-center rounded-[10px] text-white font-medium transition-transform duration-200 transform hover:-translate-y-[5px] hover:shadow-lg"
                    style={{ backgroundColor: 'rgb(42,147,243)' }}
                  >
                    <span className="text-sm">{s.title}</span>
                  </a>
                ))}

                {/* View More card */}
                <a
                  href="/services"
                  className="group block p-6 min-h-[88px] flex items-center justify-center text-center rounded-[10px] text-white font-medium transition-transform duration-200 transform hover:-translate-y-[5px] hover:shadow-lg"
                  style={{ backgroundColor: 'rgb(42,147,243)' }}
                >
                  <span className="text-sm">View More Services</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
      <footer className="mt-16 border-t bg-muted/30">
        <div className="container grid gap-8 py-10 md:grid-cols-3">
          <div>
            <div className="text-lg font-semibold">Empowering Citizens, Building Communities</div>
            <p className="mt-2 text-sm text-muted-foreground">Report issues, verify problems, and contribute to solutions.</p>
          </div>
          <nav className="grid gap-2 text-sm">
            <div className="font-semibold">Quick links</div>
            <a className="hover:text-foreground text-muted-foreground" href="/">Home</a>
            <a className="hover:text-foreground text-muted-foreground" href="/#report">Report an Issue</a>
            <a className="hover:text-foreground text-muted-foreground" href="/contributions">Community</a>
            <a className="hover:text-foreground text-muted-foreground" href="/gallery">Image Gallery</a>
          </nav>
          <div className="grid gap-2">
            <div className="font-semibold">Connect</div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <a aria-label="Facebook" className="hover:text-foreground" href="https://facebook.com" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H7v-3h3.5V9.5A4.5 4.5 0 0 1 15 5h3v3h-3a1 1 0 0 0-1 1V12H18l-.5 3h-3v7A10 10 0 0 0 22 12"/></svg>
              </a>
              <a aria-label="X" className="hover:text-foreground" href="https://twitter.com" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 3h3.7l5.2 7 6-7H21l-7.4 8.7L21 21h-3.7l-5.6-7.5L5 21H3l8.5-9.9L3 3z"/></svg>
              </a>
              <a aria-label="Instagram" className="hover:text-foreground" href="https://instagram.com" target="_blank" rel="noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.3.4.6.2 1 .4 1.5.9.5.5.7.9.9 1.5.2.4.4 1.1.4 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.3-.2.6-.4 1-.9 1.5-.5.5-.9.7-1.5.9-.4.2-1.1.4-2.3.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.4-1.5-.9-.5-.5-.7-.9-.9-1.5-.2-.4-.4-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.3.2-.6.4-1 .9-1.5.5-.5.9-.7 1.5-.9.4-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.5 0-4.7.1-1 .1-1.6.2-2 .3-.5.1-.8.3-1.1.6-.3.3-.5.6-.6 1.1-.1.4-.2 1-.3 2-.1 1.2-.1 1.5-.1 4.7s0 3.5.1 4.7c.1 1 .2 1.6.3 2 .1.5.3.8.6 1.1.3.3.6.5 1.1.6.4.1 1 .2 2 .3 1.2.1 1.5.1 4.7.1s3.5 0 4.7-.1c1-.1 1.6-.2 2-.3.5-.1.8-.3 1.1-.6.3-.3.5-.6.6-1.1.1-.4.2-1 .3-2 .1-1.2.1-1.5.1-4.7s0-3.5-.1-4.7c-.1-1-.2-1.6-.3-2-.1-.5-.3-.8-.6-1.1-.3-.3-.6-.5-1.1-.6-.4-.1-1-.2-2-.3-1.2-.1-1.5-.1-4.7-.1zm0 3.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6zm0 2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm6.4-2.9a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0z"/></svg>
              </a>
            </div>
            <a className="text-sm text-muted-foreground hover:text-foreground" href="mailto:support@sahayak.app">support@sahayak.app</a>
          </div>
        </div>
        <div className="border-t">
          <div className="container py-4 text-xs text-muted-foreground flex flex-row items-center justify-center gap-1">© 2025 Sahayak</div>
        </div>
      </footer>
    </div>
  );
}
