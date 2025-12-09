import { RequestHandler } from "express";
import { z } from "zod";
import type {
  Comment,
  CreateIssuePayload,
  GeoPoint,
  Issue,
  IssueCategory,
  IssueStatus,
  IssuesResponse,
  StatsResponse,
  VotePayload,
} from "@shared/api";

const gpSchema = z.object({ lat: z.number(), lng: z.number() });
const createIssueSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(1000),
  category: z.enum(["pothole", "graffiti", "streetlight", "garbage", "other"] as const satisfies IssueCategory[] as any),
  location: gpSchema,
  address: z.string().min(1).max(200),
  wardId: z.string().min(1).max(40),
  photoBase64: z.string().optional(),
});
const voteSchema = z.object({ userId: z.string().min(1), vote: z.union([z.literal(1), z.literal(-1)]) });
const statusSchema = z.object({ status: z.enum(["submitted","pending_verification","under_review","in_progress","resolved","escalated"] as const satisfies IssueStatus[] as any) });
const commentSchema = z.object({ userId: z.string(), userName: z.string().min(1), message: z.string().min(1).max(1000) });
const contributionSchema = z.object({ userId: z.string().min(1), userName: z.string().min(1), description: z.string().min(1).max(1000), mediaBase64: z.string().optional() });

// In-memory store (replace with DB in production)
export const issues: Issue[] = [];
const votesByIssue: Record<string, Record<string, 1 | -1>> = {};
const votesByContribution: Record<string, Record<string, 1>> = {};

function nowIso() { return new Date().toISOString(); }
function id() { return Math.random().toString(36).slice(2, 10); }

// Seed initial sample issues for verification hub
(function seedIssues() {
  if (issues.length) return;
  const samples: Issue[] = [
    {
      id: id(),
      title: "Pothole on Linking Road",
      description: "Pothole on Linking Road near the market. Vehicles swerving to avoid it.",
      category: "pothole",
      location: { lat: 19.0669, lng: 72.8345 },
      address: "Linking Road near market, Mumbai",
      wardId: "ward-1",
      photoUrl: "/placeholder.svg",
      createdAt: nowIso(),
      status: "submitted",
      upvotes: 3,
      downvotes: 0,
      verificationThreshold: 5,
      comments: [],
    },
    {
      id: id(),
      title: "Garbage overflowing",
      description: "Garbage overflowing from the community dustbin. Needs urgent pickup.",
      category: "garbage",
      location: { lat: 19.0176, lng: 72.8562 },
      address: "Community dustbin, near park",
      wardId: "ward-2",
      photoUrl: "/placeholder.svg",
      createdAt: nowIso(),
      status: "submitted",
      upvotes: 2,
      downvotes: 1,
      verificationThreshold: 5,
      comments: [],
    },
    {
      id: id(),
      title: "Footpath encroachment",
      description: "Illegal encroachment on footpath near the railway station blocking pedestrians.",
      category: "other",
      location: { lat: 19.0179, lng: 72.8470 },
      address: "Near railway station",
      wardId: "ward-3",
      photoUrl: "/placeholder.svg",
      createdAt: nowIso(),
      status: "submitted",
      upvotes: 1,
      downvotes: 0,
      verificationThreshold: 5,
      comments: [],
    },
  ];
  for (const s of samples) issues.push(s);
})();

export const listIssues: RequestHandler = (_req, res) => {
  const payload: IssuesResponse = { issues };
  res.json(payload);
};

export const createIssue: RequestHandler = (req, res) => {
  const parse = createIssueSchema.safeParse(req.body as CreateIssuePayload);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const data = parse.data;
  const newIssue: Issue = {
    id: id(),
    title: data.title,
    description: data.description,
    category: data.category as IssueCategory,
    location: data.location as GeoPoint,
    address: data.address,
    wardId: data.wardId,
    photoUrl: data.photoBase64 || "",
    createdAt: nowIso(),
    status: "submitted",
    upvotes: 0,
    downvotes: 0,
    verificationThreshold: 5,
    comments: [],
    createdBy: (req.body as any)?.userId || "anon",
  };
  issues.unshift(newIssue);
  res.status(201).json(newIssue);
};

export const voteIssue: RequestHandler = (req, res) => {
  const { id: issueId } = req.params as { id: string };
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  const parse = voteSchema.safeParse(req.body as VotePayload);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { userId, vote } = parse.data;
  votesByIssue[issueId] ||= {};
  const prev = votesByIssue[issueId][userId];
  if (prev) {
    if (prev === 1) issue.upvotes -= 1; else issue.downvotes -= 1;
  }
  votesByIssue[issueId][userId] = vote;
  if (vote === 1) issue.upvotes += 1; else issue.downvotes += 1;
  // Auto-progress to pending_verification -> under_review when threshold met
  if (issue.status === "submitted" && issue.upvotes >= issue.verificationThreshold) {
    issue.status = "pending_verification";
  } else if (issue.status === "pending_verification" && issue.upvotes - issue.downvotes >= issue.verificationThreshold) {
    issue.status = "under_review";
  }
  res.json(issue);
};

export const updateStatus: RequestHandler = (req, res) => {
  const { id: issueId } = req.params as { id: string };
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  const parse = statusSchema.safeParse(req.body as { status: IssueStatus });
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  issue.status = parse.data.status as IssueStatus;
  res.json(issue);
};

export const addComment: RequestHandler = (req, res) => {
  const { id: issueId } = req.params as { id: string };
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  const parse = commentSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const c: Comment = { id: id(), issueId, userId: parse.data.userId, userName: parse.data.userName, message: parse.data.message, createdAt: nowIso() };
  issue.comments.push(c);
  res.status(201).json(c);
};

export const addContribution: RequestHandler = (req, res) => {
  const { id: issueId } = req.params as { id: string };
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  const parse = contributionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const cid = id();
  const contrib = { id: cid, issueId, userId: parse.data.userId, userName: parse.data.userName, description: parse.data.description, mediaUrl: parse.data.mediaBase64 || "", upvotes: 0, createdAt: nowIso() } as any;
  (issue as any).contributions ||= [];
  (issue as any).contributions.push(contrib);
  res.status(201).json(contrib);
};

export const voteContribution: RequestHandler = (req, res) => {
  const { id: issueId, cid } = req.params as { id: string; cid: string };
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  const contrib = (issue as any).contributions?.find((c: any) => c.id === cid);
  if (!contrib) return res.status(404).json({ error: "Contribution not found" });
  const userId = (req.body?.userId as string) || "anon";
  (votesByContribution as any)[cid] ||= {};
  if (!(votesByContribution as any)[cid][userId]) {
    (votesByContribution as any)[cid][userId] = 1;
    contrib.upvotes = (contrib.upvotes || 0) + 1;
  }
  res.json(contrib);
};

export const stats: RequestHandler = (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const issuesReportedToday = issues.filter((i) => new Date(i.createdAt) >= startOfToday).length;
  const resolvedThisMonth = issues.filter((i) => i.status === "resolved" && new Date(i.createdAt) >= startOfMonth).length;
  // Dummy average time to resolution (no timestamps), approximate from votes
  const avgTimeToResolutionHours = Math.round(24 + (issues.length ? (issues.reduce((a, i) => a + i.upvotes, 0) / Math.max(1, issues.length)) : 0));
  const categoryCounts = issues.reduce<Record<IssueCategory, number>>((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, { pothole: 0, graffiti: 0, streetlight: 0, garbage: 0, other: 0 });
  const byCategory = (Object.keys(categoryCounts) as IssueCategory[]).map((c) => ({ category: c, count: categoryCounts[c] }));
  const payload: StatsResponse = { issuesReportedToday, resolvedThisMonth, avgTimeToResolutionHours, byCategory };
  res.json(payload);
};
