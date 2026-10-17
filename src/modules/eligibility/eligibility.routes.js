import { Router } from "express";
import * as eligibilityController from "./eligibility.controller.js";
import {
  analyseEligibilityValidator,
  eligibilityIdParamValidator,
} from "./eligibility.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /eligibility/analyse:
 *   post:
 *     summary: Run eligibility check against an opportunity (Screen D4)
 *     tags: [Eligibility]
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
 *               opportunityId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Eligibility analysis with match label and per-requirement results
 *       404:
 *         description: Opportunity not found
 */
router.post(
  "/analyse",
  analyseEligibilityValidator,
  validate,
  asyncHandler(eligibilityController.analyseEligibility),
);

/**
 * @swagger
 * /eligibility/{id}:
 *   get:
 *     summary: Get a previously computed eligibility result (Screen D4)
 *     tags: [Eligibility]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full eligibility result with items
 *       404:
 *         description: Result not found
 */
router.get(
  "/:id",
  eligibilityIdParamValidator,
  validate,
  asyncHandler(eligibilityController.getEligibilityResult),
);

export default router;
