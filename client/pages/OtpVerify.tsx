import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { LogoLoader } from "@/components/app/LogoLoader";

function useQuery() { const { search } = useLocation(); return new URLSearchParams(search); }

export default function OtpVerify() {
  const q = useQuery();
  const mobile = q.get('mobile') || '';
  const [otp, setOtp] = useState('');
  useEffect(() => {
    try {
      const d = sessionStorage.getItem('devOtp');
      if (d && /^\d{6}$/.test(d)) setOtp(d);
    } catch {}
  }, []);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const nav = useNavigate();

  async function onVerify() {
    if (!/^\d{6}$/.test(otp)) { toast({ title: 'Invalid OTP', description: 'Enter the 6-digit code' }); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile, otp }) });
      if (!r.ok) throw new Error('Verification failed');
      setShowLoader(true);
      try { localStorage.setItem('uid', 'Ayush'); sessionStorage.setItem('postLogin', '1'); } catch {}
      setTimeout(()=>{ nav('/UserPage'); }, 5200);
    } catch (e:any) {
      toast({ title: 'Verification failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ if (!mobile) nav('/login'); }, [mobile]);

  return (
    <section className="container py-12">
      {showLoader && <LogoLoader />}
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">OTP Verification</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">We sent a one-time code to {mobile}</p>
        <div className="grid place-items-center gap-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {Array.from({length:6}).map((_,i)=>(<InputOTPSlot key={i} index={i} />))}
            </InputOTPGroup>
          </InputOTP>
          <Button onClick={onVerify} disabled={loading}>{loading? 'Verifying…' : 'Verify'}</Button>
        </div>
      </div>
    </section>
  );
}
