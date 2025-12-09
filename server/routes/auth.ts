import { RequestHandler } from "express";
import { z } from "zod";
import type { LoginPayload, OtpVerifyPayload, SignupUserPayload, SignupAdminPayload, LoginResponse, OtpVerifyResponse, SignupResponse } from "@shared/api";

const pendingOtps = new Map<string, string>(); // mobile -> otp
const users: any[] = [];
const admins: any[] = [];

function genOtp() { return ("" + Math.floor(100000 + Math.random()*900000)); }

const loginSchema = z.object({ mobile: z.string().regex(/^\+91\d{10}$/), aadhar: z.string().regex(/^\d{12}$/) });
export const authLogin: RequestHandler = (req, res) => {
  const parsed = loginSchema.safeParse(req.body as LoginPayload);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { mobile } = parsed.data;
  const otp = genOtp();
  pendingOtps.set(mobile, otp);
  const devMode = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_OTP === '1';
  if (devMode) {
    console.log(`[DEV] OTP for ${mobile}: ${otp}`);
  }
  const payload: LoginResponse = { ok: true, ...(devMode ? { devOtp: otp } : {}) } as LoginResponse;
  res.json(payload);
};

const otpSchema = z.object({ mobile: z.string().regex(/^\+91\d{10}$/), otp: z.string().regex(/^\d{6}$/) });
export const verifyOtp: RequestHandler = (req, res) => {
  const parsed = otpSchema.safeParse(req.body as OtpVerifyPayload);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { mobile, otp } = parsed.data;
  const expected = pendingOtps.get(mobile);
  const devMode = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_OTP === '1';
  const isValid = expected && (otp === expected || (devMode && otp === '111111'));
  if (!isValid) return res.status(401).json({ error: "Invalid OTP" });
  pendingOtps.delete(mobile);
  const payload: OtpVerifyResponse = { ok: true, userId: mobile };
  res.json(payload);
};

const signupUserSchema = z.object({
  aadhar: z.string().regex(/^\d{12}$/),
  voterId: z.string().min(3).max(20),
  houseNumber: z.string().min(1).max(20),
  mobile: z.string().regex(/^\+91\d{10}$/),
  wardNumber: z.string().min(1),
  wardLeader: z.string().min(1),
});
export const signupUser: RequestHandler = (req, res) => {
  const parsed = signupUserSchema.safeParse(req.body as SignupUserPayload);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = users.find(u => u.aadhar === parsed.data.aadhar || u.mobile === parsed.data.mobile);
  if (existing) return res.status(409).json({ error: "User already exists" });
  const user = { id: parsed.data.mobile, role: "user", ...parsed.data };
  users.push(user);
  const payload: SignupResponse = { ok: true, userId: user.id };
  res.status(201).json(payload);
};

const signupAdminSchema = z.object({
  aadhar: z.string().regex(/^\d{12}$/),
  mobile: z.string().regex(/^\+91\d{10}$/),
  department: z.string().min(2),
  wardNumber: z.string().min(1).optional(),
});
export const signupAdmin: RequestHandler = (req, res) => {
  const parsed = signupAdminSchema.safeParse(req.body as SignupAdminPayload);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = admins.find(a => a.aadhar === parsed.data.aadhar || a.mobile === parsed.data.mobile);
  if (existing) return res.status(409).json({ error: "Admin already exists" });
  const admin = { id: parsed.data.mobile, role: "admin", ...parsed.data };
  admins.push(admin);
  const payload: SignupResponse = { ok: true, userId: admin.id };
  res.status(201).json(payload);
};
