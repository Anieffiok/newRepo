import { Router } from "express";
import * as preparationController from "./preparation.controller.js";
import { checklistValidator } from "./preparation.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /preparation/checklist:
 *   get:
 *     summary: Get unified preparation checklist for an opportunity (Screen E2)
 *     tags: [Preparation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: opportunityId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unified checklist aggregating readiness, practice, learning, and documents
 *       404:
 *         description: Opportunity not found
 */
router.get(
  "/checklist",
  checklistValidator,
  validate,
  asyncHandler(preparationController.getChecklist),
);

export default router;
