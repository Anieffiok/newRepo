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

export const reportIdParamValidator = [
  param("reportId").isUUID().withMessage("Valid report ID required"),
];

export const settingKeyParamValidator = [
  param("key").isString().trim().notEmpty().withMessage("Setting key required"),
];

export const verifyOpportunityValidator = [
  body("decision")
    .isIn(["VERIFY", "REJECT"])
    .withMessage("Decision must be VERIFY or REJECT"),
];

export const setActiveStatusValidator = [
  body("isActive").isBoolean().withMessage("isActive must be true or false"),
];

export const resolveReportValidator = [
  body("decision")
    .isIn(["RESOLVE", "DISMISS"])
    .withMessage("Decision must be RESOLVE or DISMISS"),
  body("notes").optional().isString().trim(),
];

export const updateSettingValidator = [
  body("value").exists().withMessage("Setting value is required"),
];

export const listUsersValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().isString().trim(),
];

export const listReportsValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["PENDING", "REVIEWED", "DISMISSED"]),
];

export const listAuditLogsValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
];
