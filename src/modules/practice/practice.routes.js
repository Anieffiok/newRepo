import { Router } from "express";
import * as practiceController from "./practice.controller.js";
import {
  generatePracticeValidator,
  sessionIdParamValidator,
  updateStatusValidator,
} from "./practice.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /practice/generate:
 *   post:
 *     summary: Generate practice questions for an opportunity (Screen E3)
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [opportunityId]
 *             properties:
 *               opportunityId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Practice session created with AI-generated questions
 *       200:
 *         description: Existing session returned (already generated)
 */
router.post(
  "/generate",
  generatePracticeValidator,
  validate,
  asyncHandler(practiceController.generatePractice),
);

/**
 * @swagger
 * /practice:
 *   get:
 *     summary: List all practice sessions (Screen E3)
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of practice sessions with opportunity details
 */
router.get("/", asyncHandler(practiceController.listPracticeSessions));

/**
 * @swagger
 * /practice/{id}:
 *   get:
 *     summary: Get a practice session with questions (Screen E3)
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Practice session with questions
 *       404:
 *         description: Session not found
 */
router.get(
  "/:id",
  sessionIdParamValidator,
  validate,
  asyncHandler(practiceController.getPracticeSession),
);

/**
 * @swagger
 * /practice/{id}/status:
 *   patch:
 *     summary: Update practice session status (Screen E3)
 *     tags: [Practice]
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
 *               status: { type: string, enum: [GENERATED, IN_PROGRESS, COMPLETED] }
 *     responses:
 *       200:
 *         description: Session status updated
 */
router.patch(
  "/:id/status",
  sessionIdParamValidator,
  updateStatusValidator,
  validate,
  asyncHandler(practiceController.updateSessionStatus),
);

export default router;
