import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthLanding() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [roleLogin, setRoleLogin] = useState<"user" | "admin">("user");
  const [roleSignup, setRoleSignup] = useState<"user" | "admin">("user");
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobile, setMobile] = useState("+91");
  const [aadhar, setAadhar] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [wards, setWards] = useState<{ id: string; number: string; leader: string }[]>([]);

  // Signup (user)
  const [voterId, setVoterId] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [wardLeader, setWardLeader] = useState("");

  // Signup (admin)
  const [department, setDepartment] = useState("");
  const [adminWardNumber, setAdminWardNumber] = useState("");

  const nav = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/meta/wards', { signal: controller.signal });
        if (!res.ok) {
          console.warn('Failed to fetch wards', res.status, res.statusText);
          return;
        }
        const j = await res.json();
        setWards(j.wards || []);
      } catch (err) {
        if ((err as any).name === 'AbortError') return;
        console.warn('wards fetch failed', err);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const { style } = document.body;
    if (mobileNavOpen) { style.overflow = 'hidden'; } else { style.overflow = ''; }
    return () => { style.overflow = ''; };
  }, [mobileNavOpen]);

  const shapes = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    kind: ["circle", "square", "line"][i % 3] as "circle" | "square" | "line",
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 40 + Math.random() * 120,
    dur: 8 + Math.random() * 18,
    delay: Math.random() * 5,
    hue: [24, 24, 140, 140, 140, 140, 142, 142, 142][i % 9], // saffron/white/green-ish
    sat: [95, 0, 65][i % 3],
    light: [55, 100, 45][i % 3],
    alpha: 0.18 + Math.random() * 0.2,
  })), []);

  function resetMessages() { setMessage(""); }

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("visible");
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const { style } = document.body;
    if (mobileNavOpen) { style.overflow = 'hidden'; } else { style.overflow = ''; }
    return () => { style.overflow = ''; };
  }, [mobileNavOpen]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault(); resetMessages();
    if (!/^\+91\d{10}$/.test(mobile)) { setMessage("Invalid mobile (+91XXXXXXXXXX)"); return; }
    if (!/^\d{12}$/.test(aadhar)) { setMessage("Invalid Aadhar (12 digits)"); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, aadhar }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error('Login failed');
      try { if (j?.devOtp) sessionStorage.setItem('devOtp', j.devOtp); } catch {}
      nav(`/otp?mobile=${encodeURIComponent(mobile)}`);
    } catch (e: any) {
      setMessage(e.message || 'Login failed');
    } finally { setLoading(false); }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault(); resetMessages();
    if (!/^\d{12}$/.test(aadhar)) { setMessage("Invalid Aadhar (12 digits)"); return; }
    if (!/^\+91\d{10}$/.test(mobile)) { setMessage("Invalid mobile (+91XXXXXXXXXX)"); return; }
    setLoading(true);
    try {
      if (roleSignup === 'user') {
        if (!wardNumber || !wardLeader) { setMessage('Select ward info'); setLoading(false); return; }
        const r = await fetch('/api/auth/signup-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aadhar, voterId, houseNumber, mobile, wardNumber, wardLeader }) });
        if (!r.ok) throw new Error('Signup failed');
        setMessage('Signup complete. Please login.');
        setAuthOpen(true);
      } else {
        if (!department) { setMessage('Enter department'); setLoading(false); return; }
        const body = { aadhar, mobile, department, wardNumber: adminWardNumber || undefined };
        const r = await fetch('/api/auth/signup-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error('Signup failed');
        setMessage('Admin signup complete. Please login.');
        setAuthOpen(true);
      }
    } catch (e: any) {
      setMessage(e.message || 'Signup failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-[100dvh] text-foreground" style={{ marginTop: '-4px' }}>
      {/* Animated patriotic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {shapes.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute', top: `${s.top}%`, left: `${s.left}%`,
              width: s.kind === 'line' ? 2 : s.size,
              height: s.kind === 'line' ? (s.size * 1.8) : s.size,
              background: s.kind === 'line' ? `hsla(${s.hue} ${s.sat}% ${s.light}% / ${s.alpha})` : 'transparent',
              borderRadius: s.kind === 'circle' ? '999px' : 8,
              border: s.kind !== 'line' ? `2px solid hsla(${s.hue} ${s.sat}% ${s.light}% / ${s.alpha})` : undefined,
              transformOrigin: 'center',
              animation: `float ${s.dur}s ease-in-out ${s.delay}s infinite alternate, spin ${s.dur * 2}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Local styles for animations */}
      <style>{`
        @keyframes float { from { transform: translateY(-10px) scale(1); opacity: .7 } to { transform: translateY(10px) scale(1.08); opacity: 1 } }
        @keyframes spin { to { rotate: 1turn } }
        html, body, #root { background: transparent; scroll-behavior: smooth; }
        .reveal{opacity:0; transform: translateY(14px); transition: opacity .7s ease, transform .7s ease}
        .reveal.visible{opacity:1; transform:none}
        .delay-1{transition-delay:.1s}
        .delay-2{transition-delay:.2s}
        .delay-3{transition-delay:.3s}
      `}</style>

      {/* Minimal page nav */}
      <header className="sticky top-0 z-10 w-full backdrop-blur border-b border-white/20 bg-white/20 dark:bg-black/20">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center px-4 py-3">
          <a href="#top" className="flex items-center gap-2 font-extrabold tracking-tight">
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fb6569d10404c41f582203f1ee1d47455%2F60600aeda36a4581af5906456c4452ab?format=webp&width=64" alt="Sahayak logo" className="h-9 w-9 rounded-full object-contain" />
            <span className="text-xl">Sahayak</span>
          </a>
          <nav className="hidden items-center justify-center md:flex">
            <a href="#about" className="text-sm font-medium hover:underline">About</a>
          </nav>
          <div className="hidden items-center justify-end gap-3 sm:gap-4 md:flex">
            <div className="relative">
              <button aria-label="Language" onClick={()=>setLangOpen(v=>!v)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-white/30 dark:hover:bg-white/10"><span aria-hidden="true" className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold bg-white/80 text-black/80 border">文A</span><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M7 10l5 5 5-5"/></svg></button>
              {langOpen && (
                <div className="absolute right-0 top-10 z-20 w-44 rounded-md border bg-white/90 p-1 text-sm shadow-md backdrop-blur">
                  {[
                    'English','हि���दी','বাংলা','मराठी','తెలుగు','தமிழ்','ગુજરાતી','اردو','ಕನ್ನಡ','ଓଡ଼ିଆ','മലയാളം','ਪੰਜਾਬੀ'
                  ].map(l=> (
                    <button key={l} onClick={()=>setLangOpen(false)} className="block w-full rounded px-3 py-1.5 text-left hover:bg-white/70">{l}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { setAuthMode('login'); setAuthOpen(true); }} className="rounded-md border px-3 py-1.5 text-sm hover:bg-white/30 dark:hover:bg-white/10">Login</button>
            <button onClick={() => { setAuthMode('signup'); setAuthOpen(true); }} className="rounded-md border px-3 py-1.5 text-sm hover:bg-white/30 dark:hover:bg-white/10">Sign Up</button>
          </div>
          <button aria-label="Open menu" onClick={()=>setMobileNavOpen(true)} className="md:hidden justify-self-end inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white/70 hover:bg-white/40">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M4 7h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
          </button>
        </div>
      </header>

      {/* Leaderboard ad placeholder (homepage) */}
      <div className="w-full">
        <div className="container mx-auto px-4 py-2">
          <div className="mx-auto max-w-6xl">
            <div className="w-full border-2 border-dashed border-gray-300 dark:border-white/30 bg-white/40 text-center p-3 rounded-md text-sm text-muted-foreground">
              Ad Slot: Leaderboard (728x90 desktop / 320x50 mobile)
            </div>
          </div>
        </div>
      </div>

      {/* Floating sidebar rectangle (homepage, desktop only) */}
      <div className="hidden md:block fixed right-6 top-1/3 w-72" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setMobileNavOpen(false)} />
          <div className="absolute inset-0 bg-white/95 p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Menu</span>
              <button aria-label="Close menu" onClick={()=>setMobileNavOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-black/5">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg>
              </button>
            </div>
            <nav className="mt-6 grid gap-3">
              <a href="#about" onClick={()=>setMobileNavOpen(false)} className="rounded-md border px-3 py-2">About</a>
              <div className="relative">
                <button aria-label="Language" onClick={()=>setLangOpen(v=>!v)} className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-black/5">
                  <span className="inline-flex items-center gap-2"><span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold bg-white/80 text-black/80 border">文A</span><span>Language</span></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M7 10l5 5 5-5"/></svg>
                </button>
                {langOpen && (
                  <div className="mt-2 rounded-md border bg-white p-1 text-sm shadow-md">
                    {['English','हिंदी','বাংলা','मराठी','తెలుగు','தமிழ்','ગુજરાતી','اردو','ಕನ್ನಡ','ଓଡ଼ିଆ','മലയാളം','ਪੰਜਾਬੀ'].map(l => (
                      <button key={l} onClick={()=>{setLangOpen(false); setMobileNavOpen(false);}} className="block w-full rounded px-3 py-1.5 text-left hover:bg-black/5">{l}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={()=>{ setAuthMode('login'); setAuthOpen(true); setMobileNavOpen(false); }} className="rounded-md border px-3 py-2 text-left">Login</button>
              <button onClick={()=>{ setAuthMode('signup'); setAuthOpen(true); setMobileNavOpen(false); }} className="rounded-md border px-3 py-2 text-left">Sign Up</button>
            </nav>
          </div>
        </div>
      )}

      {/* Center card with About summary and CTA */}
      <main id="top" className="relative" style={{ marginTop: '20px' }}>
        <section className="mx-auto mt-10 max-w-5xl px-4">
          <div className="rounded-2xl border border-white/30 bg-white/60 p-8 shadow-xl backdrop-blur dark:bg-white/10 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-center sm:text-left">Connecting Citizens and Municipalities</h1>
            <p className="mt-3 text-center text-muted-foreground">
              Report civic issues with photos and precise locations. Collaborate with authorities and your community to drive timely action and accountability.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center">
              <button onClick={() => { setAuthMode('login'); setAuthOpen(true); }} className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:opacity-90">Get Started</button>
            </div>
          </div>
        </section>

        {/* Multi-panel About section with sequential reveals */}
        <section id="about" className="mx-auto mt-16 max-w-5xl scroll-mt-16 px-4">
          <div className="grid gap-10">
            <div className="reveal">
              <h2 className="text-2xl font-bold text-center">Our Mission</h2>
              <p className="mt-3 leading-7 text-foreground/90 text-center">
                In cities and towns across India, local governments often face challenges in quickly identifying, prioritizing, and resolving everyday civic issues such as potholes, broken streetlights, overflowing trash bins, and waterlogging during the monsoon. While citizens experience these problems daily, the lack of effective reporting and tracking systems limits municipal responsiveness.
              </p>
            </div>
            <div className="reveal delay-1">
              <p className="leading-7 text-foreground/90 text-center">
                Sahaayak aims to bridge this gap by offering a mobile-first, citizen-centric solution that empowers people to report real issues in real-time, with photos, descriptions, and precise locations. The platform helps authorities categorize and prioritize issues efficiently, ensuring timely action and accountability.
              </p>
            </div>
            <div className="reveal delay-2 grid gap-4 rounded-xl border border-white/30 bg-white/50 p-4 backdrop-blur md:grid-cols-2 dark:bg-white/10">
              <div>
                <h3 className="text-xl font-semibold text-center">Our Impact</h3>
                <p className="mt-2 leading-7 text-foreground/90 text-center">By connecting citizens and municipalities in a transparent, collaborative way, Sahaayak strengthens community engagement, promotes cleaner neighborhoods, and contributes to building smarter, safer, and more livable cities across India. Together, we can create a system where every voice matters and every problem gets addressed.</p>
              </div>
              <div className="grid place-items-center">
                <img alt="Clean street placeholder" className="h-48 w-full max-w-sm rounded-md object-cover" src="data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23efefef'/><stop offset='1' stop-color='%23dddddd'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><g fill='%23999999' font-family='Arial' font-size='24'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'>Impact Image</text></g></svg>" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Auth overlay */}
      {authOpen && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/30 bg-white/70 p-5 backdrop-blur dark:bg-white/10">
            <button onClick={() => setAuthOpen(false)} className="absolute right-3 top-3 rounded-md border px-2 py-1 text-xs hover:bg-white/30">Close</button>

            {message && <div className="mt-4 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</div>}

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setAuthMode('login')} className={`rounded-md px-3 py-1.5 text-sm ${authMode==='login' ? 'bg-primary text-white' : 'border hover:bg-white/30'}`}>Login</button>
              <button onClick={() => setAuthMode('signup')} className={`rounded-md px-3 py-1.5 text-sm ${authMode==='signup' ? 'bg-primary text-white' : 'border hover:bg-white/30'}`}>Sign Up</button>
            </div>
            <div className="mt-4 grid gap-6">
              {authMode === 'login' && (
              <form onSubmit={onLogin} className="grid gap-4">
                <h3 className="text-lg font-semibold">Login</h3>
                <div className="grid gap-2">
                  <label htmlFor="roleLogin" className="text-sm font-medium">Role</label>
                  <select id="roleLogin" value={roleLogin} onChange={(e)=>setRoleLogin(e.target.value as any)} className="rounded-md border bg-white/80 px-3 py-2 backdrop-blur">
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="mobile" className="text-sm font-medium">Mobile (+91)</label>
                  <input id="mobile" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+911234567890" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="aadhar" className="text-sm font-medium">Aadhar</label>
                  <input id="aadhar" value={aadhar} onChange={(e)=>setAadhar(e.target.value.replace(/\D/g,''))} maxLength={12} placeholder="12-digit Aadhar" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                </div>
                <button disabled={loading} className="rounded-md bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary/90">{loading? 'Sending OTP…' : 'Continue'}</button>
              </form>
              )}

              {/* Signup */}
              {authMode === 'signup' && (roleSignup === 'user' ? (
                <form onSubmit={onSignup} className="grid gap-4">
                  <h3 className="text-lg font-semibold">Sign Up</h3>
                  <div className="grid gap-2">
                    <label htmlFor="roleSignup" className="text-sm font-medium">Role</label>
                    <select id="roleSignup" value={roleSignup} onChange={(e)=>setRoleSignup(e.target.value as any)} className="rounded-md border bg-white/80 px-3 py-2 backdrop-blur">
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <fieldset className="grid gap-3 rounded-md border p-3">
                    <legend className="px-1 text-xs font-medium">Identity</legend>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="aadhar2">Aadhar</label>
                      <input id="aadhar2" value={aadhar} onChange={(e)=>setAadhar(e.target.value.replace(/\D/g,''))} maxLength={12} placeholder="12-digit Aadhar" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="voter">Voter ID</label>
                      <input id="voter" value={voterId} onChange={(e)=>setVoterId(e.target.value)} placeholder="Voter ID" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                    </div>
                  </fieldset>
                  <fieldset className="grid gap-3 rounded-md border p-3">
                    <legend className="px-1 text-xs font-medium">Contact</legend>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="house">House Number</label>
                      <input id="house" value={houseNumber} onChange={(e)=>setHouseNumber(e.target.value)} placeholder="e.g., 12B" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="mobile2">Mobile</label>
                      <input id="mobile2" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+911234567890" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                    </div>
                  </fieldset>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Ward Number</label>
                    <select value={wardNumber} onChange={e=>setWardNumber(e.target.value)} className="rounded-md border bg-white/80 px-3 py-2">
                      <option value="">Select ward</option>
                      {wards.map(w=> (<option key={w.id} value={w.number}>{w.number}</option>))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Ward Leader</label>
                    <select value={wardLeader} onChange={e=>setWardLeader(e.target.value)} className="rounded-md border bg-white/80 px-3 py-2">
                      <option value="">Select leader</option>
                      {wards.map(w=> (<option key={w.id} value={w.leader}>{w.leader}</option>))}
                    </select>
                  </div>
                  <button disabled={loading} className="rounded-md bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary/90">{loading? 'Submitting…' : 'Create account'}</button>
                </form>
              ) : (
                <form onSubmit={onSignup} className="grid gap-4">
                  <h3 className="text-lg font-semibold">Sign Up</h3>
                  <div className="grid gap-2">
                    <label htmlFor="roleSignup2" className="text-sm font-medium">Role</label>
                    <select id="roleSignup2" value={roleSignup} onChange={(e)=>setRoleSignup(e.target.value as any)} className="rounded-md border bg-white/80 px-3 py-2 backdrop-blur">
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <fieldset className="grid gap-3 rounded-md border p-3">
                    <legend className="px-1 text-xs font-medium">Identity</legend>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="aadhar3">Aadhar</label>
                      <input id="aadhar3" value={aadhar} onChange={(e)=>setAadhar(e.target.value.replace(/\D/g,''))} maxLength={12} placeholder="12-digit Aadhar" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium" htmlFor="mobile3">Mobile</label>
                      <input id="mobile3" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+911234567890" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                    </div>
                  </fieldset>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="dept">Department</label>
                    <input id="dept" value={department} onChange={(e)=>setDepartment(e.target.value)} placeholder="e.g., Public Works" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="wardAdmin">Ward Number (optional)</label>
                    <input id="wardAdmin" value={adminWardNumber} onChange={(e)=>setAdminWardNumber(e.target.value)} placeholder="e.g., 5" className="rounded-md border bg-white/90 px-3 py-2 placeholder:text-muted-foreground" />
                  </div>
                  <button disabled={loading} className="rounded-md bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary/90">{loading? 'Submitting…' : 'Create admin account'}</button>
                </form>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
