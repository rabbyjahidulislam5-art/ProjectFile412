import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/password";
import { ApiError } from "../../lib/api-error";
import { logger } from "../../config/logger";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.validation";

const OTP_TTL_MINUTES = 10;

const publicUserSelect = {
  id: true,
  role: true,
  studentId: true,
  employeeId: true,
  fullName: true,
  email: true,
  phone: true,
  department: true,
  batch: true,
  mustResetPassword: true,
  status: true,
  createdAt: true,
} as const;

function findByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { studentId: identifier }] },
  });
}

export async function registerStudent(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { studentId: input.studentId }] },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict("An account with this student ID or email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      role: "student",
      studentId: input.studentId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      department: input.department,
      batch: input.batch,
      passwordHash,
      wallet: { create: { balance: 0 } },
    },
    select: publicUserSelect,
  });

  return user;
}

export async function login(input: LoginInput) {
  const user = await findByIdentifier(input.identifier);
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  if (user.status === "suspended") {
    throw ApiError.locked("This account has been suspended");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await findByIdentifier(input.identifier);

  // Always behave as if the request succeeded to avoid leaking account existence.
  if (!user) {
    return { message: "If an account exists, a reset code has been sent." };
  }

  const otpCode = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.passwordReset.create({
    data: { userId: user.id, otpCode, expiresAt },
  });

  // No SMS/email gateway is wired into Module 0 — deliver via server log until
  // a provider is selected for the notification module.
  logger.info({ userId: user.id, otpCode }, "Password reset OTP issued");

  return { message: "If an account exists, a reset code has been sent." };
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await findByIdentifier(input.identifier);
  if (!user) {
    throw ApiError.badRequest("Invalid or expired code");
  }

  const resetRecord = await prisma.passwordReset.findFirst({
    where: { userId: user.id, otpCode: input.otp, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!resetRecord) {
    throw ApiError.badRequest("Invalid or expired code");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustResetPassword: false } }),
    prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { used: true } }),
  ]);

  return { message: "Password reset successfully" };
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized("Session is no longer valid");

  // A voluntary change must prove ownership of the account. The forced
  // first-login reset is exempt: the account is still on an issued temporary
  // password and is locked out of everything else until it changes.
  if (!user.mustResetPassword) {
    if (!input.currentPassword) {
      throw ApiError.badRequest("Current password is required", {
        currentPassword: ["Current password is required"],
      });
    }
    const currentValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!currentValid) {
      throw ApiError.badRequest("Current password is incorrect", {
        currentPassword: ["Current password is incorrect"],
      });
    }
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustResetPassword: false },
  });
  return { message: "Password updated successfully" };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) {
    throw ApiError.unauthorized("Session is no longer valid");
  }
  return user;
}

export async function getShopIdForStaff(userId: string): Promise<string | undefined> {
  const link = await prisma.shopStaff.findFirst({ where: { userId }, select: { shopId: true } });
  return link?.shopId;
}
