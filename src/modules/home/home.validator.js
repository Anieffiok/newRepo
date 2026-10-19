import { param, body, query } from "express-validator";

export const actionIdParamValidator = [
  param("id").isUUID().withMessage("Invalid action ID"),
];

export const updateActionValidator = [
  body("status")
    .isIn(["OPEN", "DONE", "DISMISSED"])
    .withMessage("Status must be OPEN, DONE, or DISMISSED"),
];

export const listActionsValidator = [
  query("status")
    .optional()
    .isIn(["OPEN", "DONE", "DISMISSED", "ALL"])
    .withMessage("Status must be OPEN, DONE, DISMISSED, or ALL"),
  query("priority")
    .optional()
    .isIn(["HIGH", "MEDIUM", "LOW"])
    .withMessage("Priority must be HIGH, MEDIUM, or LOW"),
];
