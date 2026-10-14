import { Router } from "express";
import * as notificationController from "./notification.controller.js";
import { updateSettingsValidator } from "./notification.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /notifications/settings:
 *   get:
 *     summary: Get notification preferences
 *     description: Returns the user's notification channels (Email, In-App) and topic subscriptions (Screen I3).
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notification preferences retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/settings", asyncHandler(notificationController.getSettings));

/**
 * @swagger
 * /notifications/settings:
 *   put:
 *     summary: Update notification preferences
 *     description: Updates or toggles notification subscriptions per channel and type (Screen I3).
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     channel:
 *                       type: string
 *                       enum: [EMAIL, IN_APP]
 *                     type:
 *                       type: string
 *                       enum: [DEADLINES, OPPORTUNITIES, APPLICATION_UPDATES, SECURITY_ALERTS]
 *                     enabled:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/settings",
  updateSettingsValidator,
  validate,
  asyncHandler(notificationController.updateSettings),
);

export default router;
