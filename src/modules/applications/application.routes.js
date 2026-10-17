import { Router } from "express";
import * as applicationController from "./application.controller.js";
import {
  listApplicationsValidator,
  createApplicationValidator,
  applicationIdParamValidator,
  updateApplicationValidator,
  addStageValidator,
  stageIdParamValidator,
  updateStageValidator,
  recordOutcomeValidator,
} from "./application.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: List all applications (Screen F1)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, CLOSED, ALL] }
 *     responses:
 *       200:
 *         description: List of applications with opportunity details
 */
router.get(
  "/",
  listApplicationsValidator,
  validate,
  asyncHandler(applicationController.listApplications),
);

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Create a new application (Screen F2)
 *     tags: [Applications]
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
 *               applicationDate: { type: string, format: date }
 *               source: { type: string, enum: [FOUND_IN_ROVIA, FOUND_ELSEWHERE] }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Application created with initial Applied stage
 *       409:
 *         description: Application already exists for this opportunity
 */
router.post(
  "/",
  createApplicationValidator,
  validate,
  asyncHandler(applicationController.createApplication),
);

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     summary: Get application details with full stage timeline (Screen F3)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full application with stages and opportunity
 */
router.get(
  "/:id",
  applicationIdParamValidator,
  validate,
  asyncHandler(applicationController.getApplication),
);

/**
 * @swagger
 * /applications/{id}:
 *   put:
 *     summary: Update application details (Screen F3)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Application updated
 */
router.put(
  "/:id",
  applicationIdParamValidator,
  updateApplicationValidator,
  validate,
  asyncHandler(applicationController.updateApplication),
);

/**
 * @swagger
 * /applications/{id}/stages:
 *   post:
 *     summary: Add a stage to an application (Screen F4)
 *     tags: [Applications]
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
 *             required: [stageType]
 *             properties:
 *               stageType: { type: string, enum: [APPLIED, ASSESSMENT, INTERVIEW, FINAL_STAGE, OTHER] }
 *               status: { type: string, enum: [PLANNED, COMPLETED, SKIPPED] }
 *               scheduledDate: { type: string, format: date-time }
 *               assessmentArea: { type: string }
 *     responses:
 *       201:
 *         description: Stage added, application currentStage updated
 */
router.post(
  "/:id/stages",
  applicationIdParamValidator,
  addStageValidator,
  validate,
  asyncHandler(applicationController.addStage),
);

/**
 * @swagger
 * /applications/{id}/stages/{stageId}:
 *   put:
 *     summary: Update a stage (Screen F4)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: stageId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stage updated
 */
router.put(
  "/:id/stages/:stageId",
  applicationIdParamValidator,
  stageIdParamValidator,
  updateStageValidator,
  validate,
  asyncHandler(applicationController.updateStage),
);

/**
 * @swagger
 * /applications/{id}/outcome:
 *   post:
 *     summary: Record the final outcome of an application (Screen F5)
 *     tags: [Applications]
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
 *             required: [outcomeType, outcomeDate]
 *             properties:
 *               outcomeType:
 *                 type: string
 *                 enum: [OFFER_RECEIVED, ACCEPTED, DECLINED, REJECTED, WITHDRAWN, NO_RESPONSE, POSITION_FILLED, UNKNOWN]
 *               outcomeDate: { type: string, format: date }
 *               outcomeNotes: { type: string }
 *     responses:
 *       200:
 *         description: Outcome recorded, application closed
 */
router.post(
  "/:id/outcome",
  applicationIdParamValidator,
  recordOutcomeValidator,
  validate,
  asyncHandler(applicationController.recordOutcome),
);

export default router;
