import * as adminService from "./admin.service.js";
import ApiError from "../../utils/ApiError.js";

// ── J1: Dashboard ──────────────────────────────────────────
export async function getDashboard(req, res, next) {
  try {
    console.log("[ADMIN-CTRL] getDashboard HIT");
    const stats = await adminService.getDashboardStats();
    console.log("[ADMIN-CTRL] getDashboard SENDING RESPONSE");
    return res.json({
      success: true,
      data: stats,
      message: "Dashboard stats retrieved",
    });
  } catch (error) {
    console.error("[ADMIN-CTRL] getDashboard ERROR:", error.message);
    next(error);
  }
}

// ── J2: List Users ─────────────────────────────────────────
export async function listUsers(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.listUsers({ page, limit, search });
    return res.json({
      success: true,
      data: result,
      message: "Users retrieved",
    });
  } catch (error) {
    next(error);
  }
}

// ── J2: User Detail ────────────────────────────────────────
export async function getUserDetail(req, res, next) {
  try {
    const result = await adminService.getUserDetail(req.params.userId);
    if (!result) throw new ApiError(404, "NOT_FOUND", "User not found");
    return res.json({
      success: true,
      data: result,
      message: "User detail retrieved",
    });
  } catch (error) {
    next(error);
  }
}

// ── J5: Set User Active Status ─────────────────────────────
export async function setUserActiveStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const user = await adminService.setUserActiveStatus(
      req.params.userId,
      isActive,
    );
    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
    return res.json({
      success: true,
      data: { id: user.id, accountStatus: user.accountStatus },
      message: `User ${isActive ? "activated" : "suspended"}`,
    });
  } catch (error) {
    next(error);
  }
}

// ── J3: Pending Opportunities ──────────────────────────────
export async function listPendingOpportunities(req, res, next) {
  try {
    const opportunities = await adminService.listPendingOpportunities();
    return res.json({
      success: true,
      data: { opportunities },
      message: "Pending opportunities retrieved",
    });
  } catch (error) {
    next(error);
  }
}

// ── J3: Verify Opportunity ─────────────────────────────────
export async function verifyOpportunity(req, res, next) {
  try {
    const { decision } = req.body;
    const opp = await adminService.verifyOpportunity(
      req.params.opportunityId,
      decision,
      req.user.id,
    );
    if (!opp) throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
    return res.json({
      success: true,
      data: opp,
      message: `Opportunity ${decision === "VERIFY" ? "verified" : "rejected"}`,
    });
  } catch (error) {
    next(error);
  }
}

// ── J7: Deletion Requests ──────────────────────────────────
export async function listDeletionRequests(req, res, next) {
  try {
    const requests = await adminService.listDeletionRequests();
    return res.json({
      success: true,
      data: { requests },
      message: "Deletion requests retrieved",
    });
  } catch (error) {
    next(error);
  }
}

// ── J7: Process Deletion ───────────────────────────────────
export async function processDeletion(req, res, next) {
  try {
    const { decision } = req.body;
    const result = await adminService.processDeletion(
      req.params.requestId,
      decision,
      req.user.id,
    );
    if (!result)
      throw new ApiError(404, "NOT_FOUND", "Deletion request not found");
    return res.json({
      success: true,
      data: result,
      message: `Deletion request ${decision === "APPROVE" ? "approved" : "rejected"}`,
    });
  } catch (error) {
    next(error);
  }
}

// ── J9: Audit Logs ─────────────────────────────────────────
export async function listAuditLogs(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await adminService.listAuditLogs({ page, limit });
    return res.json({
      success: true,
      data: result,
      message: "Audit logs retrieved",
    });
  } catch (error) {
    next(error);
  }
}
