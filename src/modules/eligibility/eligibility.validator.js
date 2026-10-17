import { body, param } from "express-validator";

export const analyseEligibilityValidator = [
  body("opportunityId")
    .isUUID()
    .withMessage("A valid opportunity ID is required"),
];

export const eligibilityIdParamValidator = [
  param("id").isUUID().withMessage("Invalid eligibility result ID"),
];
