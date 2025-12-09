export interface LoginPayload { mobile: string; aadhar: string }
export interface LoginResponse { ok: boolean; devOtp?: string }
export interface OtpVerifyPayload { mobile: string; otp: string }
export interface OtpVerifyResponse { ok: boolean; userId: string }
export interface SignupUserPayload { aadhar: string; voterId: string; houseNumber: string; mobile: string; wardNumber: string; wardLeader: string }
export interface SignupAdminPayload { aadhar: string; mobile: string; department: string; wardNumber?: string }
export interface SignupResponse { ok: boolean; userId: string }
