import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { addComment, createIssue, listIssues, stats, updateStatus, voteContribution, voteIssue, addContribution } from "./routes/issues";
import { listCommunityPosts, createCommunityPost, likeCommunityPost, listUpcomingEvents } from "./routes/community";
import { getProfile, updateProfile, checkUsername, changePassword, uploadAvatar, activitySummary, getSessions, logoutAllSessions, toggle2FA } from "./routes/profile";
import { authLogin, verifyOtp, signupUser, signupAdmin } from "./routes/auth";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Issues API
  app.get("/api/issues", listIssues);
  app.post("/api/issues", createIssue);
  app.post("/api/issues/:id/vote", voteIssue);
  app.post("/api/issues/:id/comments", addComment);
  app.post("/api/issues/:id/contributions", addContribution);
  app.post("/api/issues/:id/contributions/:cid/vote", voteContribution);
  app.put("/api/issues/:id/status", updateStatus);
  app.get("/api/stats", stats);

  // Community Posts API
  app.get("/api/community-posts", listCommunityPosts);
  app.post("/api/community-posts", createCommunityPost);
  app.post("/api/community-posts/:id/like", likeCommunityPost);

  // Community Events API
  app.get("/api/community-events", listUpcomingEvents);

  // Auth API
  app.post("/api/auth/login", authLogin);
  app.post("/api/auth/verify-otp", verifyOtp);
  app.post("/api/auth/signup-user", signupUser);
  app.post("/api/auth/signup-admin", signupAdmin);

  // Profile API
  app.get("/api/profile/:userId", getProfile);
  app.put("/api/profile/:userId", updateProfile);
  app.post("/api/profile/username-check", checkUsername);
  app.post("/api/profile/:userId/change-password", changePassword);
  app.post("/api/profile/:userId/avatar", uploadAvatar);
  app.get("/api/profile/:userId/activity", activitySummary);
  app.get("/api/profile/:userId/sessions", getSessions);
  app.post("/api/profile/:userId/sessions/logout-all", logoutAllSessions);
  app.post("/api/profile/:userId/two-factor/toggle", toggle2FA);

  // Meta API
  app.get("/api/meta/wards", (_req, res) => {
    const wards = [
      { id: "ward-1", number: "1", leader: "Amit Sharma" },
      { id: "ward-2", number: "2", leader: "Priya Singh" },
      { id: "ward-3", number: "3", leader: "Rohan Mehta" },
      { id: "ward-4", number: "4", leader: "Neha Gupta" },
      { id: "ward-5", number: "5", leader: "Suresh Iyer" },
    ];
    res.json({ wards });
  });

  return app;
}
