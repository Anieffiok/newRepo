import { body, param, query } from "express-validator";

export const userIdParamValidator = [
  param("userId").isUUID().withMessage("Valid user ID required"),
];

export const opportunityIdParamValidator = [
  param("opportunityId").isUUID().withMessage("Valid opportunity ID required"),
];

export const requestIdParamValidator = [
  param("requestId").isUUID().withMessage("Valid request ID required"),
];

export const verifyOpportunityValidator = [
  body("decision")
    .isIn(["VERIFY", "REJECT"])
    .withMessage("Decision must be VERIFY or REJECT"),
];

export const setActiveStatusValidator = [
  body("isActive").isBoolean().withMessage("isActive must be true or false"),
];

export const processDeletionValidator = [
  body("decision")
    .isIn(["APPROVE", "REJECT"])
    .withMessage("Decision must be APPROVE or REJECT"),
];

export const listUsersValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().isString().trim(),
];

export const listAuditLogsValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
];
