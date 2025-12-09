/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const app = getApps().length ? getApps()[0] : initializeApp(globalThis.__firebase_config || {});
const db = getFirestore(app);

const CATEGORIES = ["Pothole", "Streetlight Out", "Garbage", "Graffiti", "Other"];
const TEXT = {
  en: {
    title: "Sahayak Citizen App",
    report: "Report an Issue",
    forums: "Community Feed",
    details: "Details",
    home: "Home",
    lang: "Language",
    step1: "Capture",
    step2: "Describe",
    step3: "Confirm & Submit",
    takePhoto: "Take a Photo",
    recordVideo: "Record a Video",
    geotag: "Haptic: Geotagging enabled with precise GPS.",
    location: "Location (auto)",
    description: "Description",
    category: "Category",
    submit: "Submit",
    yes: "YES",
    no: "NO",
    comments: "Comments",
    addComment: "Add a reply",
    post: "Post",
    back: "Back",
    profile: "Profile",
    myIssues: "Issues Submitted",
    myResolved: "Issues Resolved",
    contrast: "High Contrast",
    logout: "Logout",
    uid: "User ID",
    status: "Status",
    submitted: "submitted",
  },
  hi: {
    title: "सहायक नागरिक ऐप",
    report: "समस्या रिपोर्ट करें",
    forums: "समुदाय फ़ीड",
    details: "विवरण",
    home: "होम",
    lang: "भाषा",
    step1: "कैप्चर",
    step2: "विवरण",
    step3: "पुष्टि करें और सबमिट",
    takePhoto: "फोटो लें",
    recordVideo: "वीडियो रिकॉर्ड करें",
    geotag: "हैप्टिक: सटीक GPS के साथ जियोटैगिंग सक्षम।",
    location: "स्थान (स्वतः)",
    description: "विवरण",
    category: "���्रेणी",
    submit: "सबमिट करें",
    yes: "हाँ",
    no: "नहीं",
    comments: "टिप्पणियाँ",
    addComment: "उत्तर जोड़ें",
    post: "पोस्ट",
    back: "वापस",
    profile: "प्रोफ़ाइल",
    myIssues: "मेरे द्वारा सबमिट",
    myResolved: "मेरे सुलझे मुद्दे",
    contrast: "हाई कॉन्ट्रास्ट",
    logout: "लॉगआउट",
    uid: "यूज़र आईडी",
    status: "स्थिति",
    submitted: "सबमिट किया",
  },
};

function useLang() {
  const [lang, setLang] = useState(navigator.language.startsWith("hi") ? "hi" : "en");
  return { lang, setLang, t: (k) => TEXT[lang][k] || k };
}

function useUserId() {
  const [uid, setUid] = useState(() => localStorage.getItem("uid") || `${__app_id || "guest"}-${Math.random().toString(36).slice(2, 9)}`);
  useEffect(() => localStorage.setItem("uid", uid), [uid]);
  return { uid, setUid };
}

function useHighContrast() {
  const [hc, setHc] = useState(() => localStorage.getItem("hc") === "1");
  useEffect(() => {
    const root = document.documentElement;
    if (hc) root.classList.add("hc"); else root.classList.remove("hc");
    localStorage.setItem("hc", hc ? "1" : "0");
  }, [hc]);
  return { hc, setHc };
}

export default function SahayakCitizenApp() {
  const { lang, setLang, t } = useLang();
  const { uid, setUid } = useUserId();
  const { hc, setHc } = useHighContrast();
  const [view, setView] = useState("home"); // home | report | details | forums | my | myResolved
  const [selected, setSelected] = useState(null);
  const [reports, setReports] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReports(list);
    });
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const myReports = useMemo(() => reports.filter((r) => r.createdBy === uid), [reports, uid]);
  const myResolved = useMemo(() => myReports.filter((r) => r.status === "resolved"), [myReports]);

  function logout() {
    localStorage.removeItem("uid");
    localStorage.removeItem("hc");
    location.reload();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold">
            <span className="rounded bg-primary px-2 py-1 text-primary-foreground">Sahayak</span>
            <span>{t("title")}</span>
          </div>
          <div className="flex items-center gap-2" ref={menuRef}>
            <select aria-label={t('lang')} value={lang} onChange={(e)=>setLang(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="en">EN</option><option value="hi">हिन्दी</option></select>
            <button aria-haspopup="menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen((v)=>!v)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground" title={uid}>
              {uid}
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-4 top-12 z-50 w-56 rounded-md border bg-background p-1 shadow-md">
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={()=>{setProfileOpen(true); setMenuOpen(false);}}>{t('profile')}</button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={()=>{setView('my'); setMenuOpen(false);}}>{t('myIssues')}</button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left hover:bg-accent" onClick={()=>{setView('myResolved'); setMenuOpen(false);}}>{t('myResolved')}</button>
                <button role="menuitem" className="flex w-full items-center justify-between rounded px-3 py-2 hover:bg-accent" onClick={()=>setHc(!hc)}>
                  <span>{t('contrast')}</span>
                  <span className={`ml-2 rounded px-2 py-0.5 text-xs ${hc? 'bg-emerald-600 text-white':'bg-muted text-foreground'}`}>{hc? 'ON':'OFF'}</span>
                </button>
                <button role="menuitem" className="w-full rounded px-3 py-2 text-left text-destructive hover:bg-accent" onClick={logout}>{t('logout')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {view === "home" && (
          <Home reports={reports} onReportClick={(r)=>{setSelected(r); setView("details");}} onStartReport={()=>setView("report")} t={t} />
        )}
        {view === "my" && (
          <FilteredList title={t('myIssues')} reports={myReports} onBack={()=>setView('home')} onOpen={(r)=>{setSelected(r); setView('details');}} />
        )}
        {view === "myResolved" && (
          <FilteredList title={t('myResolved')} reports={myResolved} onBack={()=>setView('home')} onOpen={(r)=>{setSelected(r); setView('details');}} />
        )}
        {view === "report" && (
          <ReportFlow uid={uid} t={t} onDone={()=>setView("home")} />
        )}
        {view === "details" && selected && (
          <ReportDetails reportId={selected.id} t={t} onBack={()=>setView("home")} />
        )}
        {view === "forums" && (
          <CommunityFeed reports={reports} onOpen={(r)=>{setSelected(r); setView("details");}} />
        )}
      </main>

      {profileOpen && (
        <ProfileModal onClose={()=>setProfileOpen(false)} uid={uid} t={t} counts={{ submitted: myReports.length, resolved: myResolved.length }} />
      )}
    </div>
  );
}

function Home({ reports, onReportClick, onStartReport, t }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("home")}</h1>
        <button onClick={onStartReport} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:bg-primary/90">
          {t("report")}
        </button>
      </div>
      <CommunityFeed reports={reports} onOpen={onReportClick} />
    </div>
  );
}

function CommunityFeed({ reports, onOpen }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-lg border p-4 hover:shadow" role="button" onClick={()=>onOpen(r)}>
          <div className="flex items-center justify-between">
            <div className="font-semibold truncate" title={r.title || r.category}>{r.title || r.category}</div>
            <span className="text-xs text-muted-foreground">{r.category}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="rounded border px-2 py-1">👍 {r.votesYes || 0}</span>
            <span className="rounded border px-2 py-1">👎 {r.votesNo || 0}</span>
          </div>
        </div>
      ))}
      {reports.length === 0 && (
        <div className="col-span-full rounded-lg border p-8 text-center text-muted-foreground">No reports yet. Be the first to report.</div>
      )}
    </div>
  );
}

function FilteredList({ title, reports, onBack, onOpen }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="rounded-md border px-3 py-2" onClick={onBack}>{TEXT.en.back}</button>
      </div>
      <CommunityFeed reports={reports} onOpen={onOpen} />
    </div>
  );
}

function ReportFlow({ uid, t, onDone }) {
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState(null);
  const [mediaData, setMediaData] = useState("");
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation(null),
      { enableHighAccuracy: true }
    );
  }, []);

  function simulateHaptic(msg) {
    console.log("HAPTIC", msg);
    alert(msg);
  }

  function handleTake(kind) {
    setMediaType(kind);
    simulateHaptic(t("geotag"));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const payload = {
        title: title || `${category} reported`,
        description,
        category,
        location: location || null,
        mediaType: mediaType || null,
        mediaData: mediaData || "",
        status: "submitted",
        votesYes: 0,
        votesNo: 0,
        wardId: "ward-1",
        createdAt: serverTimestamp(),
        createdBy: uid,
      };
      await addDoc(collection(db, "reports"), payload);
      onDone();
    } catch (e) {
      console.error(e);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><span className={step>=1?"font-semibold text-foreground":""}>{t("step1")}</span><span>›</span><span className={step>=2?"font-semibold text-foreground":""}>{t("step2")}</span><span>›</span><span className={step>=3?"font-semibold text-foreground":""}>{t("step3")}</span></div>
      {step === 1 && (
        <div className="grid gap-4">
          <div className="rounded-lg border bg-muted/40 p-6 text-center">Camera simulation</div>
          <div className="flex items-center justify-between gap-2">
            <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" onClick={()=>handleTake("photo")}>{t("takePhoto")}</button>
            <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" onClick={()=>handleTake("video")}>{t("recordVideo")}</button>
            <button className="rounded-md border px-3 py-2" onClick={()=>setStep(2)} disabled={!mediaType}>Next</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-3">
          <label className="text-sm font-medium">{t("location")}</label>
          <input readOnly value={location?`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`:"Locating..."} className="rounded-md border bg-background px-3 py-2" />
          <label className="text-sm font-medium">{t("description")}</label>
          <div className="relative">
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="min-h-28 w-full rounded-md border bg-background px-3 py-2 pr-10" />
            <button className="absolute right-2 top-2 rounded px-2 py-1 text-muted-foreground hover:bg-muted" title="Voice to text" onClick={()=>alert("Voice-to-text simulated")}>🎤</button>
          </div>
          <label className="text-sm font-medium">{t("category")}</label>
          <select value={category} onChange={(e)=>setCategory(e.target.value)} className="rounded-md border bg-background px-3 py-2">
            {CATEGORIES.map((c)=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="flex items-center justify-between">
            <button className="rounded-md border px-3 py-2" onClick={()=>setStep(1)}>{TEXT.en.back}</button>
            <button className="rounded-md border px-3 py-2" onClick={()=>setStep(3)} disabled={!description}>Next</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{mediaType ? `Media: ${mediaType}` : "No media"}</div>
            <div className="text-sm text-muted-foreground">{t("location")}</div>
            <div className="font-medium">{location?`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`:"Locating..."}</div>
            <div className="text-sm text-muted-foreground">{t("description")}</div>
            <div className="font-medium">{description}</div>
            <div className="text-sm text-muted-foreground">{t("category")}</div>
            <div className="font-medium">{category}</div>
          </div>
          <div className="flex items-center justify-between">
            <button className="rounded-md border px-3 py-2" onClick={()=>setStep(2)}>{TEXT.en.back}</button>
            <button className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50" onClick={submit} disabled={submitting}>{t("submit")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportDetails({ reportId, t, onBack }) {
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    const unsubA = onSnapshot(doc(db, "reports", reportId), (d) => setReport({ id: d.id, ...d.data() }));
    const unsubB = onSnapshot(query(collection(db, "reports", reportId, "comments"), orderBy("createdAt", "asc")), (snap) => {
      setComments(snap.docs.map((d)=>({ id: d.id, ...d.data() })));
    });
    return () => { unsubA(); unsubB(); };
  }, [reportId]);

  function buildTree(list) {
    const byId = new Map(list.map((c)=>[c.id, { ...c, children: [] }]));
    const roots = [];
    for (const c of byId.values()) {
      if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId).children.push(c); else roots.push(c);
    }
    return roots;
  }

  async function vote(kind) {
    await updateDoc(doc(db, "reports", reportId), { [kind === "yes" ? "votesYes" : "votesNo"]: increment(1) });
  }

  async function post() {
    if (!text.trim()) return;
    await addDoc(collection(db, "reports", reportId, "comments"), { text: text.trim(), parentId: replyTo, createdAt: serverTimestamp() });
    setText("");
    setReplyTo(null);
  }

  if (!report) return <div className="rounded-lg border p-6 text-center">Loading…</div>;

  const tree = buildTree(comments);

  return (
    <div className="mx-auto max-w-3xl">
      <button className="mb-4 rounded-md border px-3 py-2" onClick={onBack}>{TEXT.en.back}</button>
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{report.title || report.category}</h2>
          <span className="text-xs text-muted-foreground">{new Date(report.createdAt?.toDate?.() || Date.now()).toLocaleString()}</span>
        </div>
        <p className="mt-2 text-muted-foreground">{report.description}</p>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={()=>vote("yes")} className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white">⬆ {t("yes")} ({report.votesYes || 0})</button>
          <button onClick={()=>vote("no")} className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-white">⬇ {t("no")} ({report.votesNo || 0})</button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-lg font-semibold">{t("comments")}</h3>
        <CommentList nodes={tree} onReply={(id)=>setReplyTo(id)} />
        <div className="mt-3 flex gap-2">
          <input value={text} onChange={(e)=>setText(e.target.value)} placeholder={t("addComment")} className="flex-1 rounded-md border bg-background px-3 py-2" />
          <button onClick={post} className="rounded-md bg-primary px-3 py-2 text-primary-foreground">{t("post")}</button>
        </div>
      </div>
    </div>
  );
}

function CommentList({ nodes, onReply }) {
  return (
    <div className="grid gap-2">
      {nodes.map((n) => (
        <div key={n.id} className="rounded-md border p-2">
          <div className="text-sm">{n.text}</div>
          <button className="mt-1 text-xs text-primary underline" onClick={()=>onReply(n.id)}>Reply</button>
          {n.children?.length ? (
            <div className="mt-2 border-l pl-3">
              <CommentList nodes={n.children} onReply={onReply} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProfileModal({ onClose, uid, t, counts }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('profile')}</h3>
          <button className="rounded px-2 py-1 text-sm hover:bg-muted" onClick={onClose}>✕</button>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="text-muted-foreground">{t('uid')}</div>
          <div className="font-mono">{uid}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{t('myIssues')}</div><div className="text-xl font-semibold">{counts.submitted}</div></div>
            <div className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{t('myResolved')}</div><div className="text-xl font-semibold">{counts.resolved}</div></div>
          </div>
        </div>
        <div className="mt-4 text-right"><button className="rounded-md border px-3 py-2" onClick={onClose}>OK</button></div>
      </div>
    </div>
  );
}
