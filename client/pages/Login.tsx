import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [mobile, setMobile] = useState("+91");
  const [aadhar, setAadhar] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\+91\d{10}$/.test(mobile)) {
      toast({ title: "Invalid mobile", description: "Use +91 followed by 10 digits" });
      return;
    }
    if (!/^\d{12}$/.test(aadhar)) {
      toast({ title: "Invalid Aadhar", description: "Enter 12 digit Aadhar number" });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, aadhar }) });
      const j = await r.json();
      if (!r.ok) throw new Error('Login failed');
      try {
        if (j?.devOtp) {
          sessionStorage.setItem('devOtp', j.devOtp);
        }
      } catch {}
      if (j?.devOtp) {
        toast({ title: 'Test OTP (dev only)', description: j.devOtp });
      }
      nav(`/otp?mobile=${encodeURIComponent(mobile)}`);
    } catch (e:any) {
      toast({ title: 'Login failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container py-12">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Login</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="mobile">Mobile (+91)</Label>
            <Input id="mobile" inputMode="numeric" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+911234567890" />
          </div>
          <div>
            <Label htmlFor="aadhar">Aadhar Number</Label>
            <Input id="aadhar" inputMode="numeric" value={aadhar} onChange={(e)=>setAadhar(e.target.value.replace(/\D/g,''))} maxLength={12} placeholder="12-digit Aadhar" />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Sending OTP…' : 'Continue'}</Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          New here? <a className="text-primary hover:underline" href="/signup">Create an account</a>
        </div>
      </div>
    </section>
  );
}
