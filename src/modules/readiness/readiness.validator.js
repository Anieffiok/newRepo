import { body, param } from "express-validator";

export const analyseReadinessValidator = [
  body("opportunityId")
    .isUUID()
    .withMessage("A valid opportunity ID is required"),
];

export const readinessIdParamValidator = [
  param("id").isUUID().withMessage("Invalid readiness result ID"),
];

export const readinessItemIdParamValidator = [
  param("itemId").isUUID().withMessage("Invalid readiness item ID"),
];

export const updateReadinessItemValidator = [
  body("status")
    .isIn(["PENDING", "DONE", "DISMISSED"])
    .withMessage("Status must be PENDING, DONE, or DISMISSED"),
];
