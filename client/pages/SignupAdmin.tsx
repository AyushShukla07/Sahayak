import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function SignupAdmin() {
  const [aadhar, setAadhar] = useState("");
  const [mobile, setMobile] = useState("+91");
  const [department, setDepartment] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhar)) { toast({ title:'Invalid Aadhar'}); return; }
    if (!/^\+91\d{10}$/.test(mobile)) { toast({ title:'Invalid mobile'}); return; }
    if (!department) { toast({ title:'Enter department'}); return; }
    setLoading(true);
    try{
      const r = await fetch('/api/auth/signup-admin',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ aadhar, mobile, department, wardNumber })});
      if (!r.ok) throw new Error('Signup failed');
      toast({ title:'Admin signup complete', description:'Please login' });
      nav('/login');
    }catch(e:any){ toast({ title:'Signup failed', description:e.message }); }
    finally{ setLoading(false); }
  }

  return (
    <section className="container py-12">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign up as Administrator</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="aadhar">Aadhar Number</Label>
            <Input id="aadhar" value={aadhar} onChange={(e)=>setAadhar(e.target.value.replace(/\D/g,''))} maxLength={12} placeholder="12-digit Aadhar" />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+911234567890" />
          </div>
          <div>
            <Label htmlFor="dept">Department</Label>
            <Input id="dept" value={department} onChange={(e)=>setDepartment(e.target.value)} placeholder="e.g., Sanitation" />
          </div>
          <div>
            <Label htmlFor="ward">Ward Number (optional)</Label>
            <Input id="ward" value={wardNumber} onChange={(e)=>setWardNumber(e.target.value)} placeholder="e.g., 3" />
          </div>
          <Button type="submit" disabled={loading}>{loading? 'Submitting…' : 'Create admin account'}</Button>
        </form>
      </div>
    </section>
  );
}
