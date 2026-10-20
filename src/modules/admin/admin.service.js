import {
  User,
  Opportunity,
  Application,
  DeletionRequest,
  AuditLog,
  Profile,
} from "../../database/models/index.js";

// ── J1: Dashboard ──────────────────────────────────────────
export async function getDashboardStats() {
  console.log("[ADMIN-SVC] getDashboardStats START");

  const totalUsers = await User.count();
  console.log("[ADMIN-SVC] totalUsers:", totalUsers);

  const totalOpportunities = await Opportunity.count();
  console.log("[ADMIN-SVC] totalOpportunities:", totalOpportunities);

  const pendingVerifications = await Opportunity.count({
    where: { verificationStatus: "UNVERIFIED" },
  });
  console.log("[ADMIN-SVC] pendingVerifications:", pendingVerifications);

  const totalApplications = await Application.count();
  console.log("[ADMIN-SVC] totalApplications:", totalApplications);

  const pendingDeletions = await DeletionRequest.count({
    where: { status: "PENDING" },
  });
  console.log("[ADMIN-SVC] pendingDeletions:", pendingDeletions);

  const recentUsers = await User.findAll({
    attributes: ["id", "email", "role", "createdAt"],
    order: [["createdAt", "DESC"]],
    limit: 5,
  });
  console.log("[ADMIN-SVC] recentUsers:", recentUsers.length);

  console.log("[ADMIN-SVC] getDashboardStats DONE");

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
    order: [["createdAt", "DESC"]],
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
    order: [["createdAt", "DESC"]],
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

// ── J7: Process Deletion ───────────────────────────────────
export async function processDeletion(requestId, decision, adminId) {
  const request = await DeletionRequest.findByPk(requestId);
  if (!request) return null;

  if (decision === "APPROVE") {
    request.status = "APPROVED";
    request.processedAt = new Date();
    await request.save();

    // Delete the user (CASCADE handles related records)
    const user = await User.findByPk(request.userId);
    if (user) await user.destroy();

    await logAction(adminId, "APPROVE_DELETION", "User", request.userId, {});
  } else {
    request.status = "REJECTED";
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
    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (err) {
    console.error("[ADMIN-SVC] Failed to write audit log:", err.message);
  }
}
