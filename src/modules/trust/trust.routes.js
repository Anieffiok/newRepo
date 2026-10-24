import { Router } from "express";
import * as trustController from "./trust.controller.js";
import { updatePrivacyValidator } from "./trust.validator.js";
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

export default router;
