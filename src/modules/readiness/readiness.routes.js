import { Router } from "express";
import * as readinessController from "./readiness.controller.js";
import {
  analyseReadinessValidator,
  readinessIdParamValidator,
  readinessItemIdParamValidator,
  updateReadinessItemValidator,
} from "./readiness.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /readiness/analyse:
 *   post:
 *     summary: Run readiness check for an opportunity (Screen E1)
 *     tags: [Readiness]
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
 *       200:
 *         description: Readiness state with actionable items
 */
router.post(
  "/analyse",
  analyseReadinessValidator,
  validate,
  asyncHandler(readinessController.analyseReadiness),
);

/**
 * @swagger
 * /readiness/{id}:
 *   get:
 *     summary: Get a readiness result (Screen E1)
 *     tags: [Readiness]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full readiness result with items
 */
router.get(
  "/:id",
  readinessIdParamValidator,
  validate,
  asyncHandler(readinessController.getReadinessResult),
);

/**
 * @swagger
 * /readiness/{id}/items/{itemId}:
 *   put:
 *     summary: Mark a readiness item as done or dismissed (Screen E1)
 *     tags: [Readiness]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: itemId
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
 *               status: { type: string, enum: [PENDING, DONE, DISMISSED] }
 *     responses:
 *       200:
 *         description: Item updated, readiness state re-evaluated
 */
router.put(
  "/:id/items/:itemId",
  readinessIdParamValidator,
  readinessItemIdParamValidator,
  updateReadinessItemValidator,
  validate,
  asyncHandler(readinessController.updateReadinessItem),
);

export default router;
