import { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Camera, Mic, MapPin, Bell, User as UserIcon, Key, Trash2, Settings as SettingsIcon } from "lucide-react";

function usePermission(name: PermissionName | "camera" | "microphone") {
  const [state, setState] = useState<PermissionState | "unknown">("unknown");

  useEffect(() => {
    let status: PermissionStatus | null = null;
    let mounted = true;
    async function check() {
      try {
        if (!("permissions" in navigator) || !(navigator as any).permissions?.query) {
          setState("unknown");
          return;
        }
        status = await (navigator as any).permissions.query({ name } as any);
        if (!mounted) return;
        setState(status.state);
        status.onchange = () => setState(status!.state);
      } catch {
        setState("unknown");
      }
    }
    check();
    return () => { mounted = false; if (status) status.onchange = null; };
  }, [name]);

  return { state, setState } as const;
}

export default function Settings() {
  const cam = usePermission("camera");
  const mic = usePermission("microphone");
  const geo = usePermission("geolocation");
  const [notifComments, setNotifComments] = useLocalStorage<boolean>("notif_comments", true);
  const [notifStatus, setNotifStatus] = useLocalStorage<boolean>("notif_status", true);
  const [notifAnnouncements, setNotifAnnouncements] = useLocalStorage<boolean>("notif_announcements", false);
  const uid = useMemo(() => (typeof localStorage !== 'undefined' && localStorage.getItem('uid')) || 'user', []);

  // Profile form
  const [username, setUsername] = useState("Ayush");
  const [email, setEmail] = useState("");
  const [avatarBase64, setAvatarBase64] = useState<string>("");

  // Change password form
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profile/${uid}`);
        const data = await res.json();
        if (data?.profile) {
          setUsername(data.profile.username || "Ayush");
          setEmail(data.profile.email || "");
        }
      } catch {}
    })();
  }, [uid]);

  async function requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(t => t.stop());
      cam.setState("granted");
    } catch {
      cam.setState("denied");
    }
  }

  async function requestMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach(t => t.stop());
      mic.setState("granted");
    } catch {
      mic.setState("denied");
    }
  }

  async function requestLocation() {
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(() => resolve(), () => reject(new Error("denied")), { enableHighAccuracy: true, timeout: 10000 });
      });
      geo.setState("granted");
    } catch {
      geo.setState("denied");
    }
  }

  async function saveProfile() {
    try {
      if (avatarBase64) {
        await fetch(`/api/profile/${uid}/avatar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64: avatarBase64 }) });
      }
      await fetch(`/api/profile/${uid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email }) });
      alert('Profile updated');
    } catch {
      alert('Failed to update profile');
    }
  }

  async function changePassword() {
    try {
      const res = await fetch(`/api/profile/${uid}/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: currentPw, next: nextPw }) });
      if (!res.ok) throw new Error('pw');
      setCurrentPw(""); setNextPw("");
      alert('Password changed');
    } catch {
      alert('Failed to change password');
    }
  }

  function onPickAvatar(file?: File) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setAvatarBase64(r.result as string);
    r.readAsDataURL(file);
  }

  function deleteAccount() {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    window.location.assign('/');
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Permissions */}
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2"><ShieldIcon /> <h2 className="font-semibold">Permissions</h2></div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Camera className="h-4 w-4" /><div>
                <div className="font-medium">Camera Access</div>
                <div className="text-xs text-muted-foreground capitalize">{cam.state}</div>
              </div></div>
              <Switch checked={cam.state === "granted"} onCheckedChange={(v) => { if (v) requestCamera(); }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Mic className="h-4 w-4" /><div>
                <div className="font-medium">Microphone Access</div>
                <div className="text-xs text-muted-foreground capitalize">{mic.state}</div>
              </div></div>
              <Switch checked={mic.state === "granted"} onCheckedChange={(v) => { if (v) requestMicrophone(); }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><div>
                <div className="font-medium">Location Access</div>
                <div className="text-xs text-muted-foreground capitalize">{geo.state}</div>
              </div></div>
              <Switch checked={geo.state === "granted"} onCheckedChange={(v) => { if (v) requestLocation(); }} />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">When you enable a permission, your browser may show a prompt. You can manage permissions in your browser site settings.</div>
        </section>

        {/* Account */}
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2"><UserIcon className="h-4 w-4" /><h2 className="font-semibold">Account</h2></div>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="avatar">Profile Picture</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={(e)=>onPickAvatar(e.target.files?.[0]||undefined)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveProfile}>Save Profile</Button>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="flex items-center gap-2"><Key className="h-4 w-4" /><h3 className="font-semibold">Change Password</h3></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" value={currentPw} onChange={(e)=>setCurrentPw(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="next">New Password</Label>
                <Input id="next" type="password" value={nextPw} onChange={(e)=>setNextPw(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={changePassword}>Update Password</Button>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" /><h3 className="font-semibold">Danger Zone</h3></div>
            <Button variant="destructive" onClick={()=>setDeleting(true)}>Delete Account</Button>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /><h2 className="font-semibold">Notifications</h2></div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>New comments on my issues</div>
              <Switch checked={!!notifComments} onCheckedChange={(v)=>setNotifComments(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>Status updates on my issues</div>
              <Switch checked={!!notifStatus} onCheckedChange={(v)=>setNotifStatus(!!v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>General announcements</div>
              <Switch checked={!!notifAnnouncements} onCheckedChange={(v)=>setNotifAnnouncements(!!v)} />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={() => history.back()}>Back</Button>
        <Button onClick={() => window.location.assign("/UserPage")}>Done</Button>
      </div>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm account deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will sign you out and clear local data. This demo does not persist accounts on a server.</p>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setDeleting(false)}>Cancel</Button><Button variant="destructive" onClick={deleteAccount}>Delete</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-muted-foreground"><path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z"/></svg>
  );
}
