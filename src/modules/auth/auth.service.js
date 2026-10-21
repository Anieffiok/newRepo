import { Op } from "sequelize";
import crypto from "node:crypto";
import {
  sequelize,
  User,
  Profile,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
} from "../../database/models/index.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/tokens.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../../utils/email.js";
import ApiError from "../../utils/ApiError.js";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

function toEmailDeliveryError(action, error) {
  logger.error(
    { err: error?.message || error, action },
    "Email delivery failed",
  );

  throw new ApiError(
    503,
    "EMAIL_DELIVERY_FAILED",
    `We couldn't send the ${action} email right now. Please try again later.`,
  );
}

/**
 * Register a new user, create an empty profile, and generate a verification token
 */
export async function register({ email, password, firstName, lastName }) {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(
      409,
      "CONFLICT",
      "An account with this email already exists",
    );
  }

  const passwordHash = await hashPassword(password);

  // Generate verification token (expires in 24 hours)
  const rawVerificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenHash = hashToken(rawVerificationToken);
  const verificationExpiresAt = new Date();
  verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

  const result = await sequelize.transaction(async (t) => {
    const user = await User.create(
      {
        firstName,
        lastName,
        email,
        passwordHash,
      },
      { transaction: t },
    );

    const profile = await Profile.create(
      {
        userId: user.id,
      },
      { transaction: t },
    );

    await EmailVerificationToken.create(
      {
        userId: user.id,
        tokenHash: verificationTokenHash,
        expiresAt: verificationExpiresAt,
      },
      { transaction: t },
    );

    return { user, profile };
  });

  // Send verification email asynchronously without blocking registration. Log and swallow
  // failures here so the response remains explicit and the promise is handled.
  const verificationUrl = `${env.frontendUrl}/verify-email?token=${rawVerificationToken}`;
  void sendVerificationEmail({
    to: result.user.email,
    firstName: result.user.firstName,
    verificationUrl,
  }).catch((error) => {
    logger.error(
      { err: error?.message || error, email: result.user.email },
      "Verification email could not be sent during registration",
    );
  });

  // Generate session tokens
  const payload = { id: result.user.id, email: result.user.email };
  const accessToken = generateAccessToken(payload);
  const rawRefreshToken = generateRefreshToken();

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: result.user.id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: refreshExpiresAt,
  });

  const userJson = result.user.toJSON();
  delete userJson.passwordHash;

  return {
    user: userJson,
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

/**
 * Verify user email using token
 */
export async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);

  // 1. Look up the token
  const tokenRecord = await EmailVerificationToken.findOne({
    where: { tokenHash },
    include: [{ model: User, as: "user" }],
  });

  // Token does not exist or was already used
  if (!tokenRecord || tokenRecord.usedAt !== null) {
    throw new ApiError(
      400,
      "TOKEN_INVALID",
      "The verification link is invalid or has already been used.",
    );
  }

  // Token expired
  if (tokenRecord.expiresAt < new Date()) {
    throw new ApiError(
      400,
      "TOKEN_EXPIRED",
      "The verification link has expired. Please request a new one.",
    );
  }

  // Mark token used and set emailVerified = true in a transaction
  await sequelize.transaction(async (t) => {
    await tokenRecord.update({ usedAt: new Date() }, { transaction: t });
    await User.update(
      { emailVerified: true },
      { where: { id: tokenRecord.userId }, transaction: t },
    );
  });
}

/**
 * Resend verification email
 */
export async function resendVerification(email) {
  const user = await User.findOne({ where: { email } });

  // Privacy protection: Return silently if user doesn't exist or is already verified
  if (!user || user.emailVerified) {
    return;
  }

  const rawVerificationToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawVerificationToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await sequelize.transaction(async (t) => {
    // Invalidate old unused tokens
    await EmailVerificationToken.update(
      { usedAt: new Date() },
      {
        where: {
          userId: user.id,
          usedAt: null,
        },
        transaction: t,
      },
    );

    // Create fresh token
    await EmailVerificationToken.create(
      {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
      { transaction: t },
    );
  });

  const verificationUrl = `${env.frontendUrl}/verify-email?token=${rawVerificationToken}`;

  try {
    await sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      verificationUrl,
    });
  } catch (error) {
    toEmailDeliveryError("verification", error);
  }
}

export async function login({ email, password }) {
  const user = await User.scope("withPassword").findOne({ where: { email } });

  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
  }

  if (user.accountStatus !== "ACTIVE") {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "This account is not active. Contact Rovia support.",
    );
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const payload = { id: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const rawRefreshToken = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt,
  });

  const userJson = user.toJSON();
  delete userJson.passwordHash;

  return {
    user: userJson,
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

export async function refresh(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Refresh token is required");
  }

  const tokenHash = hashToken(rawRefreshToken);

  const storedToken = await RefreshToken.findOne({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    include: [{ model: User, as: "user" }],
  });

  if (!storedToken || !storedToken.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired refresh token");
  }

  if (storedToken.user.accountStatus !== "ACTIVE") {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Account is suspended or deactivated",
    );
  }

  const payload = { id: storedToken.user.id, email: storedToken.user.email };
  const accessToken = generateAccessToken(payload);

  return { accessToken };
}

export async function logout({ userId, rawRefreshToken }) {
  const where = {
    userId,
    revokedAt: null,
  };

  if (rawRefreshToken) {
    where.tokenHash = hashToken(rawRefreshToken);
  }

  await RefreshToken.update(
    { revokedAt: new Date() },
    {
      where,
    },
  );
}

/**
 * Request a password reset link
 */
export async function forgotPassword(email) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return;
  }

  // Generate a random reset token
  const rawResetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawResetToken);

  // Token expires in 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Invalidate any previously active reset tokens for this user
  await PasswordResetToken.update(
    { usedAt: new Date() },
    {
      where: {
        userId: user.id,
        usedAt: null,
      },
    },
  );

  // Save new hashed reset token
  await PasswordResetToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Construct reset URL for the frontend
  const resetUrl = `${env.frontendUrl}/reset-password?token=${rawResetToken}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });
  } catch (error) {
    toEmailDeliveryError("password reset", error);
  }
}

/**
 * Reset password using a valid reset token
 */
export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);

  // Find valid, unexpired, unused token
  const resetTokenRecord = await PasswordResetToken.findOne({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    include: [{ model: User, as: "user" }],
  });

  if (!resetTokenRecord || !resetTokenRecord.user) {
    throw new ApiError(
      400,
      "INVALID_TOKEN",
      "Password reset token is invalid or has expired",
    );
  }

  const user = resetTokenRecord.user;

  // Hash the new password with Argon2
  const passwordHash = await hashPassword(password);

  // Use a transaction: update password, mark token used, revoke all refresh tokens (logout everywhere)
  await sequelize.transaction(async (t) => {
    // 1. Update user password
    await User.update(
      { passwordHash },
      { where: { id: user.id }, transaction: t },
    );

    // 2. Mark this reset token as used
    await resetTokenRecord.update({ usedAt: new Date() }, { transaction: t });

    // 3. Security: Revoke all existing sessions/refresh tokens
    // Forces the user to log in with the new password on all devices
    await RefreshToken.update(
      { revokedAt: new Date() },
      {
        where: {
          userId: user.id,
          revokedAt: null,
        },
        transaction: t,
      },
    );
  });
}
