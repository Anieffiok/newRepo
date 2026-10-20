import { Router } from "express";
import * as notificationController from "./notification.controller.js";
import {
  updateSettingsValidator,
  notificationIdParamValidator,
  listNotificationsValidator,
} from "./notification.validator.js";
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

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications with unread count (Screen C2)
 *     tags: [Notifications]
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
 *         name: unreadOnly
 *         schema: { type: boolean }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [DEADLINES, OPPORTUNITIES, APPLICATION_UPDATES, SECURITY_ALERTS] }
 *     responses:
 *       200:
 *         description: Paginated notifications with unread count
 */
router.get(
  "/",
  listNotificationsValidator,
  validate,
  asyncHandler(notificationController.listNotifications),
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read (Screen C2)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
  "/:id/read",
  notificationIdParamValidator,
  validate,
  asyncHandler(notificationController.markAsRead),
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read (Screen C2)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/read-all", asyncHandler(notificationController.markAllAsRead));

export default router;
