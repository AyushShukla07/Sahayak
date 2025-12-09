import { RequestHandler } from "express";
import { z } from "zod";
import type { CommunityPost, CommunityPostMedia, CommunityPostsResponse, CreateCommunityPostPayload, GalleryCategory, UpcomingEvent, UpcomingEventsResponse } from "@shared/api";

const createSchema = z.object({
  userId: z.string().min(1),
  description: z.string().min(1).max(2000),
  mediaBase64: z.array(z.string()).default([]),
  category: z.enum(["park_cleanup","graffiti_removal","pothole_repair","other"]).optional(),
});

const likesByPost: Record<string, Record<string, 1>> = {};
const posts: CommunityPost[] = [];

const upcomingEvents: UpcomingEvent[] = [
  { id: "e1", title: "Park Cleanup Drive", location: "Phase 2 Central Park", startsAt: new Date(Date.now() + 2*24*3600*1000).toISOString(), description: "Join neighbors for a 2-hour cleanup." },
  { id: "e2", title: "Streetlight Repair Campaign", location: "Ward 3, Sector 9", startsAt: new Date(Date.now() + 5*24*3600*1000).toISOString() },
  { id: "e3", title: "Lake Desilting Awareness", location: "City Lakefront", startsAt: new Date(Date.now() + 7*24*3600*1000).toISOString(), description: "Short awareness session and volunteer signup." },
];

function id() { return Math.random().toString(36).slice(2, 10); }
function nowIso() { return new Date().toISOString(); }

export const listCommunityPosts: RequestHandler = (_req, res) => {
  const payload: CommunityPostsResponse = { posts: posts.slice().sort((a,b)=>+new Date(b.createdAt)-+new Date(a.createdAt)) };
  res.json(payload);
};

export const createCommunityPost: RequestHandler = (req, res) => {
  const parsed = createSchema.safeParse(req.body as CreateCommunityPostPayload);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const media: CommunityPostMedia[] = (parsed.data.mediaBase64 || []).map((m) => ({ url: m, kind: m.startsWith("data:video") ? "video" : "image" }));
  const post: CommunityPost = { id: id(), userId: parsed.data.userId, description: parsed.data.description, media, upvotes: 0, createdAt: nowIso(), category: parsed.data.category || "other" };
  posts.unshift(post);
  res.status(201).json(post);
};

export const likeCommunityPost: RequestHandler = (req, res) => {
  const { id: pid } = req.params as { id: string };
  const post = posts.find((p) => p.id === pid);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const userId = (req.body?.userId as string) || "anon";
  likesByPost[pid] ||= {};
  if (!likesByPost[pid][userId]) {
    likesByPost[pid][userId] = 1;
    post.upvotes += 1;
  }
  res.json(post);
};

export const listUpcomingEvents: RequestHandler = (_req, res) => {
  const now = Date.now();
  const events = upcomingEvents
    .filter(e => +new Date(e.startsAt) >= now)
    .sort((a,b)=> +new Date(a.startsAt) - +new Date(b.startsAt));
  const payload: UpcomingEventsResponse = { events };
  res.json(payload);
};
