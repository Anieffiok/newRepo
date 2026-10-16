import { Router } from "express";
import * as opportunityController from "./opportunity.controller.js";
import {
  listOpportunitiesValidator,
  opportunityIdParamValidator,
  bringOpportunityValidator,
} from "./opportunity.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * /opportunities:
 *   get:
 *     summary: List opportunities with filters (Screen D1)
 *     tags: [Opportunities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *         description: Comma-separated types (e.g. JOB,INTERNSHIP)
 *       - in: query
 *         name: workMode
 *         schema: { type: string, enum: [REMOTE, HYBRID, ONSITE] }
 *       - in: query
 *         name: careerLevel
 *         schema: { type: string }
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [deadline, recent] }
 *       - in: query
 *         name: showExpired
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Paginated list of opportunities
 */
router.get(
  "/",
  listOpportunitiesValidator,
  validate,
  asyncHandler(opportunityController.listOpportunities),
);

/**
 * @swagger
 * /opportunities/{id}:
 *   get:
 *     summary: Get opportunity details (Screen D2)
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full opportunity with requirements and save status
 *       404:
 *         description: Opportunity not found
 */
router.get(
  "/:id",
  opportunityIdParamValidator,
  validate,
  asyncHandler(opportunityController.getOpportunity),
);

/**
 * @swagger
 * /opportunities/bring:
 *   post:
 *     summary: Bring an opportunity from outside Rovia (Screen D3)
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, organisation, type]
 *             properties:
 *               title: { type: string }
 *               organisation: { type: string }
 *               type: { type: string }
 *               sourceUrl: { type: string }
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Opportunity created
 *       200:
 *         description: Duplicate detected
 */
router.post(
  "/bring",
  authenticate,
  bringOpportunityValidator,
  validate,
  asyncHandler(opportunityController.bringOpportunity),
);

/**
 * @swagger
 * /opportunities/{id}/save:
 *   post:
 *     summary: Save an opportunity (Screen D1)
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Opportunity saved
 *       409:
 *         description: Already saved
 */
router.post(
  "/:id/save",
  authenticate,
  opportunityIdParamValidator,
  validate,
  asyncHandler(opportunityController.saveOpportunity),
);

/**
 * @swagger
 * /opportunities/{id}/save:
 *   delete:
 *     summary: Unsave an opportunity (Screen D1)
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Opportunity removed from saved list
 */
router.delete(
  "/:id/save",
  authenticate,
  opportunityIdParamValidator,
  validate,
  asyncHandler(opportunityController.unsaveOpportunity),
);

export default router;
