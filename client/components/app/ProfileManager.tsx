import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props { uid: string }

interface ProfileData { userId: string; username: string; email: string; phone: string; aadhaar?: string; avatarUrl?: string; bio?: string; twoFactorEnabled?: boolean; privacy?: { showBio: boolean; showContributions: boolean } }

export function ProfileManager({ uid }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({ userId: uid, username: uid, email: `${uid}@example.com`, phone: "", aadhaar: "", avatarUrl: "", bio: "", twoFactorEnabled: false, privacy: { showBio: true, showContributions: true } });

  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const debouncer = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/profile/${uid}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [uid]);

  function onUsernameChange(v: string) {
    setProfile((p) => ({ ...p, username: v }));
    setNameAvailable(null);
    setErr(null);
    if (debouncer.current) window.clearTimeout(debouncer.current);
    setChecking(true);
    debouncer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/username-check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: v }) });
        const data = await res.json();
        setNameAvailable(!!data.available);
      } catch { setNameAvailable(null); }
      finally { setChecking(false); }
    }, 400);
  }

  async function saveBasics() {
    setSaving(true); setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/profile/${uid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: profile.username, email: profile.email, phone: profile.phone, aadhaar: profile.aadhaar, bio: profile.bio, privacy: profile.privacy }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({error:'Error'}));
        throw new Error(j.error || 'Failed to update');
      }
      const data = await res.json();
      setProfile(data.profile);
      setMsg('Profile updated successfully');
    } catch (e: any) {
      setErr(e.message || 'Failed to update');
    } finally { setSaving(false); }
  }

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  async function onAvatarFile(file?: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setAvatarUploading(true);
      try {
        const base64 = reader.result as string;
        const res = await fetch(`/api/profile/${uid}/avatar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64 }) });
        const data = await res.json();
        setProfile((p)=>({ ...p, avatarUrl: data.url }));
      } finally { setAvatarUploading(false); }
    };
    reader.readAsDataURL(file);
  }

  // Password form
  const [pwCur, setPwCur] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword() {
    setPwSaving(true); setPwMsg(null); setPwErr(null);
    try {
      const res = await fetch(`/api/profile/${uid}/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: pwCur, next: pwNew }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({error:'Error'}));
        throw new Error(j.error || 'Failed to change password');
      }
      setPwMsg('Password changed successfully');
      setPwCur(""); setPwNew("");
    } catch (e: any) {
      setPwErr(e.message || 'Failed to change password');
    } finally { setPwSaving(false); }
  }

  if (loading) {
    return <div className="rounded-md border p-4 text-sm text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="grid gap-8">
      {/* Identity */}
      <section className="grid gap-3">
        <h3 className="font-semibold">Identity</h3>
        <div className="flex items-center gap-4">
          <img src={profile.avatarUrl || "/placeholder.svg"} alt="Avatar" className="size-16 rounded-full border object-cover" />
          <div className="grid gap-2">
            <input type="file" accept="image/*" onChange={(e)=>onAvatarFile(e.target.files?.[0])} />
            {avatarUploading && <div className="text-xs text-muted-foreground">Uploading…</div>}
          </div>
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Username</label>
          <Input value={profile.username} onChange={(e)=>onUsernameChange(e.target.value)} placeholder="Choose a username" />
          <div className="text-xs h-4">
            {checking && <span className="text-muted-foreground">Checking availability…</span>}
            {!checking && nameAvailable === true && <span className="text-emerald-600">Available</span>}
            {!checking && nameAvailable === false && <span className="text-destructive">Already taken</span>}
          </div>
        </div>
        <div className="grid gap-1">
          <label className="text-sm">About Me</label>
          <textarea value={profile.bio || ""} onChange={(e)=>setProfile((p)=>({ ...p, bio: e.target.value }))} className="min-h-24 rounded-md border bg-background px-3 py-2" placeholder="A short bio visible to others" />
        </div>
        <div className="grid gap-1 sm:grid-cols-3">
          <div className="grid gap-1">
            <label className="text-sm">Email</label>
            <Input type="email" value={profile.email} onChange={(e)=>setProfile((p)=>({ ...p, email: e.target.value }))} placeholder="you@example.com" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Phone</label>
            <Input type="tel" value={profile.phone} onChange={(e)=>setProfile((p)=>({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Aadhaar</label>
            <Input inputMode="numeric" maxLength={12} value={profile.aadhaar||""} onChange={(e)=>{
              const v = e.target.value.replace(/\D/g,"").slice(0,12);
              setProfile((p)=>({ ...p, aadhaar: v }));
            }} placeholder="12-digit Aadhaar" />
            <div className="h-4 text-xs text-muted-foreground">{(profile.aadhaar||"").length>0 && (profile.aadhaar||"").length!==12 ? 'Enter 12 digits' : ''}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveBasics} disabled={saving || nameAvailable === false}>Save changes</Button>
          {msg && <span className="text-sm text-emerald-600">{msg}</span>}
          {err && <span className="text-sm text-destructive">{err}</span>}
        </div>
      </section>

      {/* Activity */}
      <Activity uid={uid} />

      {/* Security */}
      <Security uid={uid} enabled={!!profile.twoFactorEnabled} onToggle={async ()=>{
        const r = await fetch(`/api/profile/${uid}/two-factor/toggle`, { method: 'POST' });
        const j = await r.json();
        setProfile((p)=>({ ...p, twoFactorEnabled: !!j.enabled }));
      }} />

      {/* Privacy */}
      <section className="grid gap-3 border-t pt-4">
        <h3 className="font-semibold">Privacy</h3>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!profile.privacy?.showBio} onChange={(e)=>setProfile((p)=>({ ...p, privacy: { ...(p.privacy||{showContributions:true,showBio:true}), showBio: e.target.checked } }))} /> Show "About Me" publicly</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!profile.privacy?.showContributions} onChange={(e)=>setProfile((p)=>({ ...p, privacy: { ...(p.privacy||{showContributions:true,showBio:true}), showContributions: e.target.checked } }))} /> Show my contributions and past reports</label>
        <div>
          <Button onClick={saveBasics} disabled={saving}>Save privacy</Button>
        </div>
      </section>

      {/* Password */}
      <section className="grid gap-3 border-t pt-4">
        <h3 className="font-semibold">Change Password</h3>
        <div className="grid gap-1 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-sm">Current password</label>
            <Input type="password" value={pwCur} onChange={(e)=>setPwCur(e.target.value)} placeholder="••••••" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">New password</label>
            <Input type="password" value={pwNew} onChange={(e)=>setPwNew(e.target.value)} placeholder="At least 6 characters" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={changePassword} disabled={pwSaving || pwCur.length===0 || pwNew.length < 6}>Update password</Button>
          {pwMsg && <span className="text-sm text-emerald-600">{pwMsg}</span>}
          {pwErr && <span className="text-sm text-destructive">{pwErr}</span>}
        </div>
      </section>
    </div>
  );
}

function Activity({ uid }: { uid: string }) {
  const [data, setData] = useState<{ issuesReported: number; totalUpvotes: number } | null>(null);
  useEffect(() => { (async ()=>{ try { const r = await fetch(`/api/profile/${uid}/activity`); const j = await r.json(); setData(j); } catch {} })(); }, [uid]);
  return (
    <section className="grid gap-3 border-t pt-4">
      <h3 className="font-semibold">Your Impact</h3>
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Issues Reported" value={data?.issuesReported ?? 0} />
        <Kpi label="Total Upvotes" value={data?.totalUpvotes ?? 0} />
      </div>
    </section>
  );
}

function Security({ uid, enabled, onToggle }: { uid: string; enabled: boolean; onToggle: ()=>Promise<void> | void }) {
  const [sessions, setSessions] = useState<{ id: string; device: string; ip: string; lastActive: string; current?: boolean }[]>([]);
  useEffect(() => { (async ()=>{ try { const r = await fetch(`/api/profile/${uid}/sessions`); const j = await r.json(); setSessions(j.sessions || []); } catch {} })(); }, [uid]);
  async function logoutAll() { await fetch(`/api/profile/${uid}/sessions/logout-all`, { method: 'POST' }); const r = await fetch(`/api/profile/${uid}/sessions`); const j = await r.json(); setSessions(j.sessions || []); }
  return (
    <section className="grid gap-3 border-t pt-4">
      <h3 className="font-semibold">Security</h3>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <div className="font-medium">Two-Factor Authentication</div>
          <div className="text-sm text-muted-foreground">Protect your account with an extra step at sign-in.</div>
        </div>
        <Button variant={enabled ? "default" : "outline"} onClick={()=>onToggle()}>{enabled ? "Disable 2FA" : "Enable 2FA"}</Button>
      </div>
      <div>
        <div className="mb-2 font-medium">Active Sessions</div>
        <div className="grid gap-2">
          {sessions.map((s)=> (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <div>{s.device} • {s.ip} • <span className="text-muted-foreground">{new Date(s.lastActive).toLocaleString()}</span> {s.current ? "(current)" : ""}</div>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Button variant="outline" onClick={logoutAll}>Log out of all other devices</Button>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
