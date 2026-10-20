import { body, param } from "express-validator";

export const generatePracticeValidator = [
  body("opportunityId")
    .isUUID()
    .withMessage("Opportunity ID must be a valid UUID"),
];

export const sessionIdParamValidator = [
  param("id").isUUID().withMessage("Session ID must be a valid UUID"),
];

export const updateStatusValidator = [
  body("status")
    .isIn(["GENERATED", "IN_PROGRESS", "COMPLETED"])
    .withMessage("Status must be GENERATED, IN_PROGRESS, or COMPLETED"),
];
