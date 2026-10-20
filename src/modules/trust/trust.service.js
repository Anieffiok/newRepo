import {
  User,
  Profile,
  Education,
  Experience,
  Certification,
  Document,
  UserSkill,
  Skill,
  EligibilityResult,
  Application,
  SavedOpportunity,
  Notification,
  PracticeSession,
  UserLearning,
  PrivacySetting,
  DeletionRequest,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

// ─── I1: Trust Report ────────────────────────────────────────────

/**
 * Generate a full trust report for the user.
 * Shows all data Rovia holds, grouped by category and source.
 */
export async function getTrustReport(userId) {
  const [
    user,
    profile,
    education,
    experiences,
    certifications,
    documents,
    userSkills,
    eligibilityResults,
    applications,
    savedOpportunities,
    practiceSessions,
    learningProgress,
    notifications,
  ] = await Promise.all([
    User.findByPk(userId, {
      attributes: { exclude: ["passwordHash", "password"] },
    }),
    Profile.findOne({ where: { userId } }),
    Education.findAll({ where: { userId } }),
    Experience.findAll({ where: { userId } }),
    Certification.findAll({ where: { userId } }),
    Document.findAll({ where: { userId } }),
    UserSkill.findAll({
      where: { userId },
      include: [{ model: Skill, as: "skill", attributes: ["name"] }],
    }),
    EligibilityResult.findAll({ where: { userId } }),
    Application.findAll({ where: { userId } }),
    SavedOpportunity.findAll({ where: { userId } }),
    PracticeSession.findAll({ where: { userId } }),
    UserLearning.findAll({ where: { userId } }),
    Notification.findAll({ where: { userId } }),
  ]);

  return {
    account: {
      email: user.email,
      joinedAt: user.createdAt,
      source: "USER_PROVIDED",
    },
    profile: {
      exists: !!profile,
      fields: profile
        ? Object.keys(profile.toJSON()).filter(
            (k) =>
              !["id", "userId", "createdAt", "updatedAt"].includes(k) &&
              profile[k] !== null,
          )
        : [],
      source: "USER_PROVIDED",
    },
    data: [
      {
        category: "Education",
        count: education.length,
        source: "USER_PROVIDED",
        items: education.map((e) => ({
          id: e.id,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
        })),
      },
      {
        category: "Experience",
        count: experiences.length,
        source: "USER_PROVIDED",
        items: experiences.map((e) => ({
          id: e.id,
          role: e.role,
          company: e.company,
        })),
      },
      {
        category: "Certifications",
        count: certifications.length,
        source: "USER_PROVIDED",
        items: certifications.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
        })),
      },
      {
        category: "Skills",
        count: userSkills.length,
        source: "USER_PROVIDED",
        items: userSkills.map((s) => s.skill?.name).filter(Boolean),
      },
      {
        category: "Documents",
        count: documents.length,
        source: "USER_PROVIDED",
        items: documents.map((d) => ({
          id: d.id,
          type: d.documentType,
          name: d.fileName,
        })),
      },
      {
        category: "Eligibility Checks",
        count: eligibilityResults.length,
        source: "AI_GENERATED",
        items: eligibilityResults.map((e) => ({
          id: e.id,
          match: e.matchLabel,
          date: e.createdAt,
        })),
      },
      {
        category: "Applications",
        count: applications.length,
        source: "USER_PROVIDED",
        items: applications.map((a) => ({
          id: a.id,
          status: a.status,
          date: a.createdAt,
        })),
      },
      {
        category: "Saved Opportunities",
        count: savedOpportunities.length,
        source: "USER_PROVIDED",
      },
      {
        category: "Practice Sessions",
        count: practiceSessions.length,
        source: "AI_GENERATED",
      },
      {
        category: "Learning Progress",
        count: learningProgress.length,
        source: "USER_PROVIDED",
      },
      {
        category: "Notifications",
        count: notifications.length,
        source: "SYSTEM_GENERATED",
      },
    ],
    summary: {
      totalDataPoints:
        education.length +
        experiences.length +
        certifications.length +
        userSkills.length +
        documents.length +
        eligibilityResults.length +
        applications.length +
        savedOpportunities.length +
        practiceSessions.length +
        learningProgress.length +
        notifications.length,
      userProvided:
        education.length +
        experiences.length +
        certifications.length +
        userSkills.length +
        documents.length +
        applications.length +
        savedOpportunities.length +
        learningProgress.length,
      aiGenerated: eligibilityResults.length + practiceSessions.length,
      systemGenerated: notifications.length,
    },
  };
}

// ─── I2: Privacy Controls ────────────────────────────────────────

/**
 * Get the user's current privacy settings.
 * Creates default settings if none exist.
 */
export async function getPrivacySettings(userId) {
  let settings = await PrivacySetting.findOne({ where: { userId } });

  if (!settings) {
    settings = await PrivacySetting.create({ userId });
  }

  return settings;
}

/**
 * Update the user's privacy settings.
 */
export async function updatePrivacySettings(userId, updates) {
  let settings = await PrivacySetting.findOne({ where: { userId } });

  if (!settings) {
    settings = await PrivacySetting.create({ userId });
  }

  const allowedFields = [
    "profileVisibility",
    "showEducation",
    "showExperience",
    "showSkills",
    "showCertifications",
    "showApplications",
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      settings[field] = updates[field];
    }
  }

  await settings.save();
  return settings;
}

// ─── I4: Data Deletion ───────────────────────────────────────────

/**
 * Request full account and data deletion.
 * Creates a pending request — does not delete immediately.
 */
export async function requestDeletion(userId, reason) {
  // Check for existing pending request
  const existing = await DeletionRequest.findOne({
    where: { userId, status: "PENDING" },
  });

  if (existing) {
    throw new ApiError(
      409,
      "CONFLICT",
      "You already have a pending deletion request",
    );
  }

  return DeletionRequest.create({
    userId,
    reason: reason || null,
    status: "PENDING",
  });
}

/**
 * Cancel a pending deletion request.
 */
export async function cancelDeletion(userId, requestId) {
  const request = await DeletionRequest.findOne({
    where: { id: requestId, userId, status: "PENDING" },
  });

  if (!request) {
    throw new ApiError(404, "NOT_FOUND", "Pending deletion request not found");
  }

  request.status = "CANCELLED";
  await request.save();

  return request;
}

/**
 * Get the status of the user's deletion requests.
 */
export async function getDeletionStatus(userId) {
  return DeletionRequest.findAll({
    where: { userId },
    order: [["created_at", "DESC"]],
  });
}
