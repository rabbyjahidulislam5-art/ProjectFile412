import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const OTP_HASH_ROUNDS = 10;

export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_HASH_ROUNDS);
}

export function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
