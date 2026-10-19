import { Router } from "express";
import * as homeController from "./home.controller.js";
import {
  actionIdParamValidator,
  updateActionValidator,
  listActionsValidator,
} from "./home.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Get Home dashboard with actions, deadlines, recommendations (Screen C1)
 *     tags: [Home]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated dashboard data
 */
router.get("/home", asyncHandler(homeController.getHomeDashboard));

/**
 * @swagger
 * /actions:
 *   get:
 *     summary: List all actions grouped by urgency (Screen G3)
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [OPEN, DONE, DISMISSED, ALL] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [HIGH, MEDIUM, LOW] }
 *     responses:
 *       200:
 *         description: Actions grouped into today, thisWeek, later
 */
router.get(
  "/actions",
  listActionsValidator,
  validate,
  asyncHandler(homeController.listActions),
);

/**
 * @swagger
 * /actions/{id}:
 *   put:
 *     summary: Mark an action as done or dismissed (Screen G3)
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [OPEN, DONE, DISMISSED] }
 *     responses:
 *       200:
 *         description: Action updated
 */
router.put(
  "/actions/:id",
  actionIdParamValidator,
  updateActionValidator,
  validate,
  asyncHandler(homeController.updateAction),
);

export default router;
