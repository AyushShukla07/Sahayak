import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getDefaultLocale } from "@/lib/i18n";

const SERVICES = [
  { id: 'pay-house-tax', title: 'Pay House Tax Online' },
  { id: 'pay-water-tax', title: 'Pay Water Tax Online' },
  { id: 'birth-cert', title: 'Apply for Birth Certificate' },
  { id: 'death-cert', title: 'Apply for Death Certificate' },
  { id: 'lodge-complaint', title: 'Lodge a Complaint (Civic Issues)' },
  { id: 'track-complaint', title: 'Track Complaint Status' },
  { id: 'book-hall', title: 'Book Community Hall / Ground' },
];

export default function Services() {
  const [locale, setLocale] = useLocalStorage<string>('locale', getDefaultLocale());
  const [query, setQuery] = useState('');
  const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Services</h1>
          {!uid && (
            <div className="flex items-center gap-2">
              <Link to="/" className="rounded-md border px-3 py-1.5 text-sm hover:bg-white/5">Login</Link>
              <Link to="/signup" className="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90">Sign Up</Link>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium">Language</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className="ml-2 rounded-md border bg-background px-2 py-1 text-sm">
            {['en','hi','bn','mr','te','ta','gu','ur','kn','or','ml','pa'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {SERVICES.map(s => (
            <div key={s.id} className="rounded-xl border border-white/30 bg-white/5 shadow-sm backdrop-blur hover:shadow-md transition-shadow duration-200">
              <a href={`#${s.id}`} className="block p-6 min-h-[88px] flex items-center justify-center text-center text-sm font-medium">{s.title}</a>
            </div>
          ))}

          <div className="rounded-xl border border-white/30 bg-white/5 shadow-sm backdrop-blur hover:shadow-md transition-shadow duration-200">
            <Link to="/" className="block p-6 min-h-[88px] flex items-center justify-center text-center text-sm font-medium">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
