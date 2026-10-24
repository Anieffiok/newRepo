import {
  User,
  Opportunity,
  Application,
  DeletionRequest,
  AuditLog,
  Profile,
  ContentReport,
  SystemSetting,
} from "../../database/models/index.js";
import { fn, col, literal } from "sequelize";

// ── J1: Dashboard ──────────────────────────────────────────
export async function getDashboardStats() {
  const totalUsers = await User.count();
  const totalOpportunities = await Opportunity.count();
  const pendingVerifications = await Opportunity.count({
    where: { verificationStatus: "UNVERIFIED" },
  });
  const totalApplications = await Application.count();
  const pendingDeletions = await DeletionRequest.count({
    where: { status: "PENDING" },
  });
  const recentUsers = await User.findAll({
    attributes: ["id", "email", "role", "createdAt"],
    order: [["created_at", "DESC"]],
    limit: 5,
  });

  return {
    users: { total: totalUsers },
    opportunities: {
      total: totalOpportunities,
      pendingVerification: pendingVerifications,
    },
    applications: { total: totalApplications },
    deletionRequests: { pending: pendingDeletions },
    recentUsers,
  };
}

// ── J2: List Users ─────────────────────────────────────────
export async function listUsers({ page = 1, limit = 20, search } = {}) {
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    const { Op } = await import("sequelize");
    where[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: [
      "id",
      "email",
      "firstName",
      "lastName",
      "role",
      "accountStatus",
      "createdAt",
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

// ── J2: User Detail ────────────────────────────────────────
export async function getUserDetail(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: Profile, as: "profile" }],
  });
  if (!user) return null;

  const applicationCount = await Application.count({ where: { userId } });
  return { user, applicationCount };
}

// ── J5: Set User Active Status ─────────────────────────────
export async function setUserActiveStatus(userId, isActive) {
  const user = await User.findByPk(userId);
  if (!user) return null;

  user.accountStatus = isActive ? "ACTIVE" : "SUSPENDED";
  await user.save();
  return user;
}

// ── J3: Pending Opportunities ──────────────────────────────
export async function listPendingOpportunities() {
  return Opportunity.findAll({
    where: { verificationStatus: "UNVERIFIED" },
    order: [["created_at", "DESC"]],
  });
}

// ── J3: Verify Opportunity ─────────────────────────────────
export async function verifyOpportunity(opportunityId, decision, adminId) {
  const opp = await Opportunity.findByPk(opportunityId);
  if (!opp) return null;

  opp.verificationStatus = decision === "VERIFY" ? "VERIFIED" : "REJECTED";
  opp.trustLabel = decision === "VERIFY" ? "OFFICIALLY_VERIFIED" : "UNVERIFIED";
  opp.checkedBy = adminId;
  opp.lastCheckedAt = new Date();
  await opp.save();

  await logAction(adminId, "VERIFY_OPPORTUNITY", "Opportunity", opportunityId, {
    decision,
  });
  return opp;
}

// ── J4: Content Reports ────────────────────────────────────
export async function listContentReports({
  page = 1,
  limit = 20,
  status,
} = {}) {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await ContentReport.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "reporter",
        attributes: ["id", "email", "firstName", "lastName"],
      },
      { model: User, as: "reviewer", attributes: ["id", "email", "firstName"] },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    reports: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function resolveContentReport(reportId, decision, notes, adminId) {
  const report = await ContentReport.findByPk(reportId);
  if (!report) return null;

  report.status = decision === "DISMISS" ? "DISMISSED" : "REVIEWED";
  report.resolutionNotes = notes || null;
  report.reviewedBy = adminId;
  await report.save();

  await logAction(adminId, "RESOLVE_REPORT", "ContentReport", reportId, {
    decision,
  });
  return report;
}

// ── J6: Reports & Analytics ────────────────────────────────
export async function getOverviewReport() {
  const [
    totalUsers,
    activeUsers,
    totalOpportunities,
    verifiedOpportunities,
    totalApplications,
    pendingDeletions,
    pendingReports,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { accountStatus: "ACTIVE" } }),
    Opportunity.count(),
    Opportunity.count({ where: { verificationStatus: "VERIFIED" } }),
    Application.count(),
    DeletionRequest.count({ where: { status: "PENDING" } }),
    ContentReport.count({ where: { status: "PENDING" } }),
  ]);

  // Application breakdown by status
  const applicationsByStatus = await Application.findAll({
    attributes: ["status", [fn("COUNT", col("status")), "count"]],
    group: ["status"],
    raw: true,
  });

  // User signups in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSignups = await User.count({
    where: {
      created_at: {
        [await import("sequelize").then((s) => s.Op.gte)]: thirtyDaysAgo,
      },
    },
  });

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      newLast30Days: recentSignups,
    },
    opportunities: {
      total: totalOpportunities,
      verified: verifiedOpportunities,
    },
    applications: { total: totalApplications, byStatus: applicationsByStatus },
    moderation: { pendingDeletions, pendingReports },
  };
}

export async function getApplicationsReport() {
  const byStage = await Application.findAll({
    attributes: ["currentStage", [fn("COUNT", col("current_stage")), "count"]],
    group: ["current_stage"],
    raw: true,
  });

  const byOutcome = await Application.findAll({
    attributes: ["outcomeType", [fn("COUNT", col("outcome_type")), "count"]],
    where: {
      outcomeType: { [await import("sequelize").then((s) => s.Op.ne)]: null },
    },
    group: ["outcome_type"],
    raw: true,
  });

  return { byStage, byOutcome };
}

// ── J7: Deletion Requests ──────────────────────────────────
export async function listDeletionRequests() {
  return DeletionRequest.findAll({
    where: { status: "PENDING" },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "firstName", "lastName"],
      },
    ],
    order: [["created_at", "ASC"]],
  });
}

export async function processDeletion(requestId, decision, adminId) {
  const request = await DeletionRequest.findByPk(requestId);
  if (!request) return null;

  if (decision === "APPROVE") {
    request.status = "COMPLETED";
    request.processedAt = new Date();
    await request.save();

    const user = await User.findByPk(request.userId);
    if (user) await user.destroy();

    await logAction(adminId, "APPROVE_DELETION", "User", request.userId, {});
  } else {
    request.status = "CANCELLED";
    request.processedAt = new Date();
    await request.save();

    await logAction(
      adminId,
      "REJECT_DELETION",
      "DeletionRequest",
      requestId,
      {},
    );
  }

  return request;
}

// ── J8: System Settings ────────────────────────────────────
export async function getSettings() {
  return SystemSetting.findAll({
    attributes: ["key", "value", "description", "updatedAt"],
    order: [["key", "ASC"]],
  });
}

export async function updateSetting(key, value, adminId) {
  const setting = await SystemSetting.findOne({ where: { key } });
  if (!setting) return null;

  setting.value = String(value);
  setting.updatedBy = adminId;
  await setting.save();

  await logAction(adminId, "UPDATE_SETTING", "SystemSetting", setting.id, {
    key,
    value,
  });
  return setting;
}

// ── J9: Audit Logs ─────────────────────────────────────────
export async function listAuditLogs({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    include: [
      { model: User, as: "admin", attributes: ["id", "email", "firstName"] },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    logs: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

// ── Helper: Log Action ─────────────────────────────────────
async function logAction(adminId, action, targetType, targetId, details) {
  try {
    await AuditLog.create({ adminId, action, targetType, targetId, details });
  } catch (err) {
    console.error("[ADMIN-SVC] Failed to write audit log:", err.message);
  }
}
