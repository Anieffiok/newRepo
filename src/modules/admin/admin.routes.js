import { Router } from "express";
import authenticate from "../../middleware/authenticate.js";
import requireRole from "../../middleware/requireRole.js";
import validate from "../../middleware/validate.js";
import * as ctrl from "./admin.controller.js";
import {
  userIdParamValidator,
  opportunityIdParamValidator,
  requestIdParamValidator,
  reportIdParamValidator,
  settingKeyParamValidator,
  verifyOpportunityValidator,
  setActiveStatusValidator,
  processDeletionValidator,
  resolveReportValidator,
  updateSettingValidator,
  listUsersValidator,
  listReportsValidator,
  listAuditLogsValidator,
} from "./admin.validator.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 *       403:
 *         description: Insufficient permissions
 */
router.get("/dashboard", requireRole("ADMIN"), ctrl.getDashboard);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: List all users with pagination and search
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.get(
  "/users",
  requireRole("ADMIN"),
  listUsersValidator,
  validate,
  ctrl.listUsers,
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get detailed user profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User detail retrieved
 *       404:
 *         description: User not found
 */
router.get(
  "/users/:userId",
  requireRole("ADMIN"),
  userIdParamValidator,
  validate,
  ctrl.getUserDetail,
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/status:
 *   patch:
 *     summary: Activate or suspend a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch(
  "/users/:userId/status",
  requireRole("ADMIN"),
  userIdParamValidator,
  setActiveStatusValidator,
  validate,
  ctrl.setUserActiveStatus,
);

/**
 * @swagger
 * /api/v1/admin/opportunities/pending:
 *   get:
 *     summary: List opportunities pending verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending opportunities retrieved
 */
router.get(
  "/opportunities/pending",
  requireRole("ADMIN", "OPERATIONS"),
  ctrl.listPendingOpportunities,
);

/**
 * @swagger
 * /api/v1/admin/opportunities/{opportunityId}/verify:
 *   post:
 *     summary: Verify or reject an opportunity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [VERIFY, REJECT]
 *     responses:
 *       200:
 *         description: Opportunity verified or rejected
 */
router.post(
  "/opportunities/:opportunityId/verify",
  requireRole("ADMIN", "OPERATIONS"),
  opportunityIdParamValidator,
  verifyOpportunityValidator,
  validate,
  ctrl.verifyOpportunity,
);

/**
 * @swagger
 * /api/v1/admin/content-reports:
 *   get:
 *     summary: List content moderation reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, REVIEWED, DISMISSED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Content reports retrieved
 */
router.get(
  "/content-reports",
  requireRole("ADMIN", "MODERATOR"),
  listReportsValidator,
  validate,
  ctrl.listContentReports,
);

/**
 * @swagger
 * /api/v1/admin/content-reports/{reportId}/resolve:
 *   post:
 *     summary: Resolve or dismiss a content report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [RESOLVE, DISMISS]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report resolved or dismissed
 */
router.post(
  "/content-reports/:reportId/resolve",
  requireRole("ADMIN", "MODERATOR"),
  reportIdParamValidator,
  resolveReportValidator,
  validate,
  ctrl.resolveContentReport,
);

/**
 * @swagger
 * /api/v1/admin/reports/overview:
 *   get:
 *     summary: Get platform overview analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview report retrieved
 */
router.get(
  "/reports/overview",
  requireRole("ADMIN", "OPERATIONS"),
  ctrl.getOverviewReport,
);

/**
 * @swagger
 * /api/v1/admin/reports/applications:
 *   get:
 *     summary: Get application funnel analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications report retrieved
 */
router.get(
  "/reports/applications",
  requireRole("ADMIN", "OPERATIONS"),
  ctrl.getApplicationsReport,
);

/**
 * @swagger
 * /api/v1/admin/deletions:
 *   get:
 *     summary: List pending account deletion requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deletion requests retrieved
 */
router.get(
  "/deletions",
  requireRole("ADMIN", "OPERATIONS"),
  ctrl.listDeletionRequests,
);

/**
 * @swagger
 * /api/v1/admin/deletions/{requestId}/process:
 *   post:
 *     summary: Approve or reject a deletion request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *     responses:
 *       200:
 *         description: Deletion request processed
 */
router.post(
  "/deletions/:requestId/process",
  requireRole("ADMIN", "OPERATIONS"),
  requestIdParamValidator,
  processDeletionValidator,
  validate,
  ctrl.processDeletion,
);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get("/settings", requireRole("ADMIN"), ctrl.getSettings);

/**
 * @swagger
 * /api/v1/admin/settings/{key}:
 *   patch:
 *     summary: Update a system setting
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 *       404:
 *         description: Setting not found
 */
router.patch(
  "/settings/:key",
  requireRole("ADMIN"),
  settingKeyParamValidator,
  updateSettingValidator,
  validate,
  ctrl.updateSetting,
);

/**
 * @swagger
 * /api/v1/admin/audit-logs:
 *   get:
 *     summary: List audit trail entries
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Audit logs retrieved
 */
router.get(
  "/audit-logs",
  requireRole("ADMIN"),
  listAuditLogsValidator,
  validate,
  ctrl.listAuditLogs,
);

export default router;
