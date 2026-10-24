import crypto from "node:crypto";
import {
  sequelize,
  User,
  Profile,
  Education,
  Skill,
  Experience,
  Certification,
  CareerGoal,
  Interest,
  EmailVerificationToken,
  Document,
} from "../../database/models/index.js";
import { deleteFileFromStorage } from "../../utils/storage.js";
import { verifyPassword } from "../../utils/password.js";
import { hashToken } from "../../utils/tokens.js";
import { sendVerificationEmail } from "../../utils/email.js";
import ApiError from "../../utils/ApiError.js";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

/**
 * Update user account info (names, email).
 * If email changes, marks emailVerified=false and sends verification link.
 */
export async function updateMe(userId, { firstName, lastName, email }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  let emailChanged = false;
  let rawVerificationToken = null;

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new ApiError(
        409,
        "CONFLICT",
        "An account with this email already exists",
      );
    }
    emailChanged = true;
    rawVerificationToken = crypto.randomBytes(32).toString("hex");
  }

  await sequelize.transaction(async (t) => {
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (emailChanged) {
      user.email = email;
      user.emailVerified = false;

      // Invalidate old tokens and create new verification token
      const tokenHash = hashToken(rawVerificationToken);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await EmailVerificationToken.update(
        { usedAt: new Date() },
        { where: { userId: user.id, usedAt: null }, transaction: t },
      );

      await EmailVerificationToken.create(
        { userId: user.id, tokenHash, expiresAt },
        { transaction: t },
      );
    }

    await user.save({ transaction: t });
  });

  if (emailChanged) {
    const verificationUrl = `${env.frontendUrl}/verify-email?token=${rawVerificationToken}`;
    void sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      verificationUrl,
    }).catch((error) => {
      logger.error(
        { err: error?.message || error, email: user.email },
        "Verification email could not be sent after profile update",
      );
    });
  }

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    emailVerificationPending: emailChanged,
  };
}

/**
 * Generate full JSON export of all personal data (Screen I2 - GDPR/NDPR)
 */
export async function exportUserData(userId) {
  const user = await User.findByPk(userId, {
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "role",
      "accountStatus",
      "emailVerified",
      "createdAt",
      "lastLoginAt",
    ],
    include: [
      { model: Profile, as: "profile" },
      { model: Education, as: "education" },
      { model: Experience, as: "experiences" },
      { model: Certification, as: "certifications" },
      { model: CareerGoal, as: "careerGoals" },
      {
        model: Skill,
        as: "skills",
        through: { attributes: ["proficiency", "evidence"] },
      },
      {
        model: Interest,
        as: "interests",
        through: { attributes: [] },
      },
    ],
  });

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  return {
    exportedAt: new Date().toISOString(),
    account: user,
  };
}

/**
 * Permanently delete the user account and all of their data.
 * Requires the current password. Database rows are removed by the
 * ON DELETE CASCADE foreign keys. Uploaded files are removed from storage.
 */
export async function deleteMe(userId, password) {
  const user = await User.scope("withPassword").findByPk(userId);
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  const isMatch = await verifyPassword(user.passwordHash, password);
  if (!isMatch) {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Incorrect password. Account deletion cancelled.",
    );
  }

  // Collect the storage keys of uploaded files before the rows are removed
  const documents = await Document.findAll({
    where: { userId },
    attributes: ["storageKey"],
  });
  const storageKeys = documents.map((doc) => doc.storageKey).filter(Boolean);

  // Removing the user deletes related rows (profile, education, experience,
  // certifications, goals, interests, skills, documents, applications,
  // eligibility and readiness results, notifications, saved opportunities,
  // practice sessions, learning progress, privacy settings, tokens and
  // notification preferences) through ON DELETE CASCADE.
  await user.destroy();

  // Remove uploaded files. The account is already gone, so failures are logged only.
  for (const key of storageKeys) {
    try {
      await deleteFileFromStorage(key);
    } catch (error) {
      logger.error(
        { err: error?.message || error, key },
        "Failed to delete stored file for a deleted account",
      );
    }
  }
}
