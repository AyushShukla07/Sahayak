/**
 * Shared code between client and server
 */

export type IssueStatus =
  | "submitted"
  | "pending_verification"
  | "under_review"
  | "in_progress"
  | "resolved"
  | "escalated";

export type IssueCategory =
  | "pothole"
  | "graffiti"
  | "streetlight"
  | "garbage"
  | "other";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface Contribution {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  description: string;
  mediaUrl: string; // base64 or URL
  upvotes: number;
  createdAt: string;
}

export interface VotePayload {
  userId: string;
  vote: 1 | -1;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: GeoPoint;
  address: string;
  wardId: string;
  photoUrl: string;
  createdAt: string;
  status: IssueStatus;
  upvotes: number;
  downvotes: number;
  verificationThreshold: number;
  comments: Comment[];
  contributions?: Contribution[];
  createdBy?: string; // userId of reporter (for demo)
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  category: IssueCategory;
  location: GeoPoint;
  address: string;
  wardId: string;
  photoBase64?: string;
  userId?: string; // reporter
}

export interface IssuesResponse {
  issues: Issue[];
}

export interface StatsResponse {
  issuesReportedToday: number;
  resolvedThisMonth: number;
  avgTimeToResolutionHours: number;
  byCategory: { category: IssueCategory; count: number }[];
}

export interface DemoResponse {
  message: string;
}

// Community Feed Types
export interface CommunityPostMedia {
  url: string; // base64 data URL or external URL
  kind: "image" | "video";
}

export type GalleryCategory = "park_cleanup" | "graffiti_removal" | "pothole_repair" | "other";

export interface CommunityPost {
  id: string;
  userId: string;
  description: string;
  media: CommunityPostMedia[];
  upvotes: number;
  createdAt: string;
  category?: GalleryCategory;
}

export interface CreateCommunityPostPayload {
  userId: string;
  description: string;
  mediaBase64: string[]; // any number of images/videos as data URLs
  category?: GalleryCategory;
}

export interface CommunityPostsResponse {
  posts: CommunityPost[];
}

// Community Events (Upcoming practices)
export interface UpcomingEvent {
  id: string;
  title: string;
  description?: string;
  location: string;
  startsAt: string; // ISO date-time
}

export interface UpcomingEventsResponse { events: UpcomingEvent[] }

// Profile management types
export interface PrivacySettings {
  showBio: boolean;
  showContributions: boolean;
}

export interface SessionInfo {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  current?: boolean;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  phone: string;
  aadhaar?: string;
  avatarUrl?: string;
  bio?: string;
  twoFactorEnabled?: boolean;
  privacy?: PrivacySettings;
}

export interface GetProfileResponse {
  profile: UserProfile;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  phone?: string;
  aadhaar?: string;
  bio?: string;
  privacy?: PrivacySettings;
}

export interface UsernameCheckPayload { username: string }
export interface UsernameCheckResponse { available: boolean }

export interface ChangePasswordPayload { current: string; next: string }
export interface ChangePasswordResponse { ok: true }

export interface UploadAvatarResponse { url: string }
export interface ActivitySummary { issuesReported: number; totalUpvotes: number }
export interface SessionsResponse { sessions: SessionInfo[] }
export interface Toggle2FAResponse { enabled: boolean }

export type { LoginPayload, LoginResponse, OtpVerifyPayload, OtpVerifyResponse, SignupUserPayload, SignupAdminPayload, SignupResponse } from "./auth.d";
