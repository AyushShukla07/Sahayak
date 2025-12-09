import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function SignupUser() {
  const [aadhar, setAadhar] = useState("");
  const [voterId, setVoterId] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [mobile, setMobile] = useState("+91");
  const [wardNumber, setWardNumber] = useState("");
  const [wardLeader, setWardLeader] = useState("");
  const [wards, setWards] = useState<{id:string; number:string; leader:string}[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(()=>{ (async()=>{ try{ const r = await fetch('/api/meta/wards'); const j = await r.json(); setWards(j.wards||[]);}catch{}})(); },[]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhar)) { toast({ title:'Invalid Aadhar'}); return; }
    if (!/^\+91\d{10}$/.test(mobile)) { toast({ title:'Invalid mobile'}); return; }
    if (!wardNumber || !wardLeader) { toast({ title:'Select ward info'}); return; }
    setLoading(true);
    try{
      const r = await fetch('/api/auth/signup-user',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ aadhar, voterId, houseNumber, mobile, wardNumber, wardLeader })});
      if (!r.ok) throw new Error('Signup failed');
      toast({ title:'Signup complete', description:'Please login' });
      nav('/login');
    }catch(e:any){ toast({ title:'Signup failed', description:e.message }); }
    finally{ setLoading(false); }
  }

  return (
    <section className="container py-12">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign up as User</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="aadhar">Aadhar Number</Label>
            <Input id="aadhar" value={aadhar} onChange={(e)=>setAadhar(e.target.value.replace(/\D/g,''))} maxLength={12} placeholder="12-digit Aadhar" />
          </div>
          <div>
            <Label htmlFor="voter">Voter ID</Label>
            <Input id="voter" value={voterId} onChange={(e)=>setVoterId(e.target.value)} placeholder="Voter ID" />
          </div>
          <div>
            <Label htmlFor="house">House Number</Label>
            <Input id="house" value={houseNumber} onChange={(e)=>setHouseNumber(e.target.value)} placeholder="e.g., 12B" />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+911234567890" />
          </div>
          <div>
            <Label>Ward Number</Label>
            <Select value={wardNumber} onValueChange={setWardNumber}>
              <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
              <SelectContent>
                {wards.map(w=> (<SelectItem key={w.id} value={w.number}>{w.number}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ward Leader</Label>
            <Select value={wardLeader} onValueChange={setWardLeader}>
              <SelectTrigger><SelectValue placeholder="Select leader" /></SelectTrigger>
              <SelectContent>
                {wards.map(w=> (<SelectItem key={w.id} value={w.leader}>{w.leader}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>{loading? 'Submitting…' : 'Create account'}</Button>
        </form>
      </div>
    </section>
  );
}
