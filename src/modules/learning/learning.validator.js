import { body, param, query } from "express-validator";

export const resourceIdParamValidator = [
  param("resourceId").isUUID().withMessage("Resource ID must be a valid UUID"),
];

export const updateStatusValidator = [
  body("status")
    .isIn(["SAVED", "IN_PROGRESS", "COMPLETED"])
    .withMessage("Status must be SAVED, IN_PROGRESS, or COMPLETED"),
];

export const listResourcesValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("difficulty")
    .optional()
    .isIn(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
    .withMessage("Invalid difficulty level"),
  query("freeOnly")
    .optional()
    .isIn(["true", "false"])
    .withMessage("freeOnly must be true or false"),
];
