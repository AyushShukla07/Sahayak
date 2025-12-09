import "./global.css";

// Global fetch wrapper: catch network errors (e.g. preview/proxy networking) and return a safe Response
if (typeof window !== "undefined") {
  const _rawFetch = window.fetch.bind(window);
  (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      return await _rawFetch(input as any, init);
    } catch (err) {
      // Log for debugging and return a synthetic Response with non-ok status and empty JSON body
      // This prevents unhandled TypeError: Failed to fetch exceptions in the UI
      // and allows callers that do `await res.json()` to receive an object.
      // eslint-disable-next-line no-console
      console.error("Fetch failed:", input, err);
      return new Response(JSON.stringify({}), {
        status: 502,
        statusText: "Bad Gateway",
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

const Index = lazy(() => import("./pages/Index"));
const AuthLanding = lazy(() => import("./pages/AuthLanding"));
const MyIssues = lazy(() => import("./pages/MyIssues"));
const MyResolved = lazy(() => import("./pages/MyResolved"));
const Issues = lazy(() => import("./pages/Issues"));
const Contributions = lazy(() => import("./pages/Contributions"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const OtpVerify = lazy(() => import("./pages/OtpVerify"));
const Signup = lazy(() => import("./pages/Signup"));
const SignupUser = lazy(() => import("./pages/SignupUser"));
const Services = lazy(() => import("./pages/Services"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminDepartments = lazy(() => import("./pages/admin/Departments"));
const AdminIssues = lazy(() => import("./pages/admin/Issues"));
const AdminLeaderboards = lazy(() => import("./pages/admin/Leaderboards"));
const AdminWardLeaders = lazy(() => import("./pages/admin/WardLeaders"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const queryClient = new QueryClient();

import { Layout } from "@/components/app/Layout";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;
  if (!uid) return <Navigate to="/" replace />;
  return children;
}

const Fallback = () => (
  <div className="p-6 text-sm text-muted-foreground">Loading…</div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/" element={<AuthLanding />} />
              <Route path="/UserPage" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/issues" element={<RequireAuth><Issues /></RequireAuth>} />
              <Route path="/contributions" element={<RequireAuth><Contributions /></RequireAuth>} />
              <Route path="/gallery" element={<RequireAuth><Gallery /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/my-issues" element={<RequireAuth><MyIssues /></RequireAuth>} />
              <Route path="/my-resolved" element={<RequireAuth><MyResolved /></RequireAuth>} />
              <Route path="/otp" element={<OtpVerify />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/user" element={<SignupUser />} />
              <Route path="/services" element={<Services />} />
              <Route path="/Admin" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="departments" element={<AdminDepartments />} />
                <Route path="issues" element={<AdminIssues />} />
                <Route path="leaderboards" element={<AdminLeaderboards />} />
              <Route path="ward-leaders" element={<AdminWardLeaders />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
