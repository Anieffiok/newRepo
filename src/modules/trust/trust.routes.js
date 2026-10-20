import { Router } from "express";
import * as trustController from "./trust.controller.js";
import {
  updatePrivacyValidator,
  deletionRequestValidator,
  deletionIdParamValidator,
} from "./trust.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /trust/report:
 *   get:
 *     summary: Get full trust report showing all user data (Screen I1)
 *     tags: [Trust & Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete data inventory with source labels
 */
router.get("/report", asyncHandler(trustController.getTrustReport));

/**
 * @swagger
 * /trust/privacy:
 *   get:
 *     summary: Get privacy settings (Screen I2)
 *     tags: [Trust & Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current privacy and visibility settings
 */
router.get("/privacy", asyncHandler(trustController.getPrivacySettings));

/**
 * @swagger
 * /trust/privacy:
 *   patch:
 *     summary: Update privacy settings (Screen I2)
 *     tags: [Trust & Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileVisibility: { type: string, enum: [PUBLIC, PRIVATE] }
 *               showEducation: { type: boolean }
 *               showExperience: { type: boolean }
 *               showSkills: { type: boolean }
 *               showCertifications: { type: boolean }
 *               showApplications: { type: boolean }
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch(
  "/privacy",
  updatePrivacyValidator,
  validate,
  asyncHandler(trustController.updatePrivacySettings),
);

/**
 * @swagger
 * /trust/deletion:
 *   post:
 *     summary: Request full account and data deletion (Screen I4)
 *     tags: [Trust & Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Deletion request submitted
 *       409:
 *         description: Pending request already exists
 */
router.post(
  "/deletion",
  deletionRequestValidator,
  validate,
  asyncHandler(trustController.requestDeletion),
);

/**
 * @swagger
 * /trust/deletion:
 *   get:
 *     summary: Get deletion request status (Screen I4)
 *     tags: [Trust & Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deletion requests
 */
router.get("/deletion", asyncHandler(trustController.getDeletionStatus));

/**
 * @swagger
 * /trust/deletion/{id}/cancel:
 *   patch:
 *     summary: Cancel a pending deletion request (Screen I4)
 *     tags: [Trust & Privacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request cancelled
 *       404:
 *         description: Pending request not found
 */
router.patch(
  "/deletion/:id/cancel",
  deletionIdParamValidator,
  validate,
  asyncHandler(trustController.cancelDeletion),
);

export default router;
