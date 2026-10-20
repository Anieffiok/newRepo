import { Router } from "express";
import * as learningController from "./learning.controller.js";
import {
  resourceIdParamValidator,
  updateStatusValidator,
  listResourcesValidator,
} from "./learning.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /learning:
 *   get:
 *     summary: List curated learning resources (Screen E4)
 *     tags: [Learning]
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
 *         name: skillCategory
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED] }
 *       - in: query
 *         name: freeOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of learning resources
 */
router.get(
  "/",
  listResourcesValidator,
  validate,
  asyncHandler(learningController.listResources),
);

/**
 * @swagger
 * /learning/suggested:
 *   get:
 *     summary: Get AI-suggested resources based on skill gaps (Screen E4)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Curated and AI-suggested resources
 */
router.get(
  "/suggested",
  asyncHandler(learningController.getSuggestedResources),
);

/**
 * @swagger
 * /learning/my:
 *   get:
 *     summary: List user's saved learning resources (Screen E5)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's learning list with progress
 */
router.get("/my", asyncHandler(learningController.listMyLearning));

/**
 * @swagger
 * /learning/{resourceId}/save:
 *   post:
 *     summary: Save a resource to learning list (Screen E5)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Resource saved
 *       409:
 *         description: Already saved
 */
router.post(
  "/:resourceId/save",
  resourceIdParamValidator,
  validate,
  asyncHandler(learningController.saveResource),
);

/**
 * @swagger
 * /learning/{resourceId}/status:
 *   patch:
 *     summary: Update learning progress status (Screen E5)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
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
 *               status: { type: string, enum: [SAVED, IN_PROGRESS, COMPLETED] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/:resourceId/status",
  resourceIdParamValidator,
  updateStatusValidator,
  validate,
  asyncHandler(learningController.updateLearningStatus),
);

export default router;
