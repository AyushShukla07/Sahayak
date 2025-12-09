import { RequestHandler } from "express";
import { z } from "zod";
import type {
  ActivitySummary,
  ChangePasswordPayload,
  ChangePasswordResponse,
  GetProfileResponse,
  SessionsResponse,
  Toggle2FAResponse,
  UpdateProfilePayload,
  UploadAvatarResponse,
  UserProfile,
  UsernameCheckPayload,
  UsernameCheckResponse,
} from "@shared/api";
import { issues } from "./issues";

const updateSchema = z.object({
  username: z.string().min(2).max(32).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  aadhaar: z.string().regex(/^\d{12}$/).optional(),
  bio: z.string().max(300).optional(),
  privacy: z.object({ showBio: z.boolean(), showContributions: z.boolean() }).optional(),
});
const usernameSchema = z.object({ username: z.string().min(2).max(32) });
const changePwSchema = z.object({ current: z.string().min(4), next: z.string().min(6) });

// In-memory demo store
const profiles = new Map<string, (UserProfile & { password: string; sessions: { id: string; device: string; ip: string; lastActive: string; current?: boolean }[] })>();
const takenUsernames = new Set<string>(["citizen", "admin", "support"]);

function ensureProfile(userId: string) {
  if (!profiles.has(userId)) {
    const username = userId;
    profiles.set(userId, {
      userId,
      username,
      email: `${userId}@example.com`,
      phone: "",
      aadhaar: "",
      avatarUrl: "",
      bio: "",
      twoFactorEnabled: false,
      privacy: { showBio: true, showContributions: true },
      password: "password",
      sessions: [
        { id: `sess-${Math.random().toString(36).slice(2,8)}`, device: "This device", ip: "127.0.0.1", lastActive: new Date().toISOString(), current: true },
      ],
    });
    takenUsernames.add(username);
  }
  return profiles.get(userId)!;
}

export const getProfile: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  const payload: GetProfileResponse = { profile: { userId: p.userId, username: p.username, email: p.email, phone: p.phone, aadhaar: (p as any).aadhaar || "", avatarUrl: p.avatarUrl, bio: p.bio, twoFactorEnabled: p.twoFactorEnabled, privacy: p.privacy } };
  res.json(payload);
};

export const updateProfile: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  const parse = updateSchema.safeParse(req.body as UpdateProfilePayload);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { username, email, phone, aadhaar, bio, privacy } = parse.data as any;
  if (username && username !== p.username) {
    if (takenUsernames.has(username)) return res.status(409).json({ error: "Username already taken" });
    takenUsernames.delete(p.username);
    p.username = username;
    takenUsernames.add(username);
  }
  if (typeof email === "string") p.email = email;
  if (typeof phone === "string") p.phone = phone;
  if (typeof aadhaar === "string") (p as any).aadhaar = aadhaar;
  if (typeof bio === "string") p.bio = bio;
  if (privacy) p.privacy = privacy as any;
  const payload: GetProfileResponse = { profile: { userId: p.userId, username: p.username, email: p.email, phone: p.phone, aadhaar: (p as any).aadhaar || "", avatarUrl: p.avatarUrl, bio: p.bio, twoFactorEnabled: p.twoFactorEnabled, privacy: p.privacy } };
  res.json(payload);
};

export const checkUsername: RequestHandler = (req, res) => {
  const parse = usernameSchema.safeParse(req.body as UsernameCheckPayload);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const available = !takenUsernames.has(parse.data.username);
  const payload: UsernameCheckResponse = { available };
  res.json(payload);
};

export const changePassword: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  const parse = changePwSchema.safeParse(req.body as ChangePasswordPayload);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { current, next } = parse.data;
  if (p.password !== current) return res.status(401).json({ error: "Incorrect current password" });
  p.password = next;
  const payload: ChangePasswordResponse = { ok: true };
  res.json(payload);
};

export const uploadAvatar: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  const url = (req.body?.base64 as string) || "";
  p.avatarUrl = url;
  const payload: UploadAvatarResponse = { url };
  res.json(payload);
};

export const activitySummary: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  ensureProfile(userId);
  const reported = issues.filter((i) => i.createdBy === userId);
  const totalUpvotes = reported.reduce((a, i) => a + (i.upvotes || 0), 0);
  const payload: ActivitySummary = { issuesReported: reported.length, totalUpvotes };
  res.json(payload);
};

export const getSessions: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  const payload: SessionsResponse = { sessions: p.sessions };
  res.json(payload);
};

export const logoutAllSessions: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  p.sessions = p.sessions.filter((s) => s.current); // keep current as logged in
  res.json({ ok: true });
};

export const toggle2FA: RequestHandler = (req, res) => {
  const { userId } = req.params as { userId: string };
  const p = ensureProfile(userId);
  p.twoFactorEnabled = !p.twoFactorEnabled;
  const payload: Toggle2FAResponse = { enabled: p.twoFactorEnabled! };
  res.json(payload);
};
