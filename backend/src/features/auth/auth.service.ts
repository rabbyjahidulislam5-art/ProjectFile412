import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/password";
import { generateOtp, hashOtp, verifyOtp } from "../../lib/otp";
import { sendMail } from "../../lib/mailer";
import {
  accountActivatedEmail,
  forgotPasswordOtpEmail,
  otpVerificationEmail,
  passwordChangedEmail,
} from "../../lib/email-templates";
import { ApiError } from "../../lib/api-error";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.validation";

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
  emailVerified: true,
  status: true,
  createdAt: true,
} as const;

function findByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { studentId: identifier }] },
  });
}

// Generic per-user OTP send guard shared by registration verification and
// password reset — a short cooldown between sends plus an hourly cap, on top
// of the IP-level otpRateLimit middleware.
async function enforceOtpSendLimits(
  delegate: {
    findFirst: (args: { where: { userId: string }; orderBy: { createdAt: "desc" } }) => Promise<{ createdAt: Date } | null>;
    count: (args: { where: { userId: string; createdAt: { gt: Date } } }) => Promise<number>;
  },
  userId: string,
) {
  const mostRecent = await delegate.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (mostRecent) {
    const secondsSinceLast = (Date.now() - mostRecent.createdAt.getTime()) / 1000;
    if (secondsSinceLast < env.OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      throw ApiError.badRequest(`Please wait ${waitSeconds}s before requesting another code`, {
        retryAfterSeconds: waitSeconds,
      });
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const sentLastHour = await delegate.count({ where: { userId, createdAt: { gt: oneHourAgo } } });
  if (sentLastHour >= env.OTP_MAX_SENDS_PER_HOUR) {
    throw ApiError.badRequest("Too many codes requested. Please try again in an hour.");
  }
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

  // Wallet creation is deferred to verifyEmail — an unverified account has
  // no wallet yet per the Auth Module's mandatory email-verification flow.
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
      emailVerified: false,
    },
  });

  const otpPlain = generateOtp();
  const otpHash = await hashOtp(otpPlain);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.emailVerification.create({ data: { userId: user.id, otpHash, expiresAt } });

  await sendMail({
    to: user.email,
    ...otpVerificationEmail({ fullName: user.fullName, otp: otpPlain, ttlMinutes: env.OTP_TTL_MINUTES }),
  });

  return { email: user.email, fullName: user.fullName };
}

export async function verifyEmail(input: VerifyEmailInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.badRequest("Invalid or expired code");
  }
  if (user.emailVerified) {
    throw ApiError.badRequest("This account is already verified. Please log in.");
  }

  const record = await prisma.emailVerification.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest("Invalid or expired code. Please request a new one.");
  }

  const isValid = await verifyOtp(input.otp, record.otpHash);
  if (!isValid) {
    await prisma.emailVerification.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    throw ApiError.badRequest("Incorrect code. Please try again.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    prisma.wallet.create({ data: { userId: user.id, balance: 0 } }),
    prisma.emailVerification.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  try {
    await sendMail({ to: user.email, ...accountActivatedEmail({ fullName: user.fullName }) });
  } catch (error) {
    logger.error({ error, userId: user.id }, "Failed to send account-activated email");
  }

  return { message: "Email verified. Your account is now active — please log in." };
}

export async function resendVerificationOtp(input: ResendVerificationInput) {
  const genericResult = { message: "If an unverified account exists, a new code has been sent." };

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.emailVerified) {
    return genericResult;
  }

  await enforceOtpSendLimits(prisma.emailVerification, user.id);

  const otpPlain = generateOtp();
  const otpHash = await hashOtp(otpPlain);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.emailVerification.create({ data: { userId: user.id, otpHash, expiresAt } });
  await sendMail({
    to: user.email,
    ...otpVerificationEmail({ fullName: user.fullName, otp: otpPlain, ttlMinutes: env.OTP_TTL_MINUTES }),
  });

  return genericResult;
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

  // Only students go through the public register + OTP flow; staff accounts
  // (admin_office/library/accounts_office/shop_staff) are provisioned directly
  // by Admin Office (Module 0 §4) and have no email-verification step to gate on.
  if (user.role === "student" && !user.emailVerified) {
    throw ApiError.forbidden("Please verify your email before logging in.", {
      reason: "email_not_verified",
      email: user.email,
    });
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  const genericResult = { message: "If an account exists, a reset code has been sent." };
  const user = await findByIdentifier(input.identifier);

  // Always behave as if the request succeeded to avoid leaking account existence.
  if (!user) {
    return genericResult;
  }

  await enforceOtpSendLimits(prisma.passwordReset, user.id).catch((error) => {
    // Swallow the cooldown/limit error here too — surfacing "you already
    // requested a code" would leak account existence to an attacker who
    // guessed a valid identifier.
    if (error instanceof ApiError) return;
    throw error;
  });

  const otpPlain = generateOtp();
  const otpHash = await hashOtp(otpPlain);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.passwordReset.create({ data: { userId: user.id, otpHash, expiresAt } });

  await sendMail({
    to: user.email,
    ...forgotPasswordOtpEmail({ fullName: user.fullName, otp: otpPlain, ttlMinutes: env.OTP_TTL_MINUTES }),
  });

  return genericResult;
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await findByIdentifier(input.identifier);
  if (!user) {
    throw ApiError.badRequest("Invalid or expired code");
  }

  const resetRecord = await prisma.passwordReset.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!resetRecord || resetRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest("Invalid or expired code");
  }

  const isValid = await verifyOtp(input.otp, resetRecord.otpHash);
  if (!isValid) {
    await prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { attempts: { increment: 1 } } });
    throw ApiError.badRequest("Invalid or expired code");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustResetPassword: false } }),
    prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { used: true } }),
  ]);

  try {
    await sendMail({ to: user.email, ...passwordChangedEmail({ fullName: user.fullName }) });
  } catch (error) {
    logger.error({ error, userId: user.id }, "Failed to send password-changed email");
  }

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

  try {
    await sendMail({ to: user.email, ...passwordChangedEmail({ fullName: user.fullName }) });
  } catch (error) {
    logger.error({ error, userId: user.id }, "Failed to send password-changed email");
  }

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
