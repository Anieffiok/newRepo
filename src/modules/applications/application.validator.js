import { body, param, query } from "express-validator";

const SOURCES = ["FOUND_IN_ROVIA", "FOUND_ELSEWHERE"];
const STAGE_TYPES = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "FINAL_STAGE",
  "OTHER",
];
const STAGE_STATUSES = ["PLANNED", "COMPLETED", "SKIPPED"];
const OUTCOME_TYPES = [
  "OFFER_RECEIVED",
  "ACCEPTED",
  "DECLINED",
  "REJECTED",
  "WITHDRAWN",
  "NO_RESPONSE",
  "POSITION_FILLED",
  "UNKNOWN",
];

// ─── List (F1) ──────────────────────────────────────────────────
export const listApplicationsValidator = [
  query("status")
    .optional()
    .isIn(["ACTIVE", "CLOSED", "ALL"])
    .withMessage("Status must be ACTIVE, CLOSED, or ALL"),
];

// ─── Create (F2) ────────────────────────────────────────────────
export const createApplicationValidator = [
  body("opportunityId")
    .isUUID()
    .withMessage("A valid opportunity ID is required"),
  body("applicationDate")
    .optional()
    .isISO8601()
    .withMessage("Application date must be a valid date"),
  body("applicationUrl")
    .optional()
    .isURL({ require_protocol: true })
    .withMessage("Application URL must be a valid web address"),
  body("source")
    .optional()
    .isIn(SOURCES)
    .withMessage("Source must be FOUND_IN_ROVIA or FOUND_ELSEWHERE"),
  body("notes").optional().isString().isLength({ max: 5000 }),
];

// ─── Application ID param ───────────────────────────────────────
export const applicationIdParamValidator = [
  param("id").isUUID().withMessage("Invalid application ID"),
];

// ─── Update Application (F3) ────────────────────────────────────
export const updateApplicationValidator = [
  body("applicationDate").optional().isISO8601(),
  body("applicationUrl").optional().isURL({ require_protocol: true }),
  body("notes").optional().isString().isLength({ max: 5000 }),
];

// ─── Add Stage (F4) ─────────────────────────────────────────────
export const addStageValidator = [
  body("stageType")
    .isIn(STAGE_TYPES)
    .withMessage(`Stage type must be one of: ${STAGE_TYPES.join(", ")}`),
  body("status")
    .optional()
    .isIn(STAGE_STATUSES)
    .withMessage("Status must be PLANNED, COMPLETED, or SKIPPED"),
  body("scheduledDate")
    .optional()
    .isISO8601()
    .withMessage("Scheduled date must be a valid date"),
  body("completionDate")
    .optional()
    .isISO8601()
    .withMessage("Completion date must be a valid date"),
  body("assessmentArea").optional().isString().isLength({ max: 255 }),
  body("notes").optional().isString().isLength({ max: 2000 }),
];

// ─── Stage ID param ─────────────────────────────────────────────
export const stageIdParamValidator = [
  param("stageId").isUUID().withMessage("Invalid stage ID"),
];

// ─── Update Stage (F4) ──────────────────────────────────────────
export const updateStageValidator = [
  body("status").optional().isIn(STAGE_STATUSES),
  body("scheduledDate").optional().isISO8601(),
  body("completionDate").optional().isISO8601(),
  body("assessmentArea").optional().isString().isLength({ max: 255 }),
  body("notes").optional().isString().isLength({ max: 2000 }),
];

// ─── Record Outcome (F5) ────────────────────────────────────────
export const recordOutcomeValidator = [
  body("outcomeType")
    .isIn(OUTCOME_TYPES)
    .withMessage(`Outcome must be one of: ${OUTCOME_TYPES.join(", ")}`),
  body("outcomeDate")
    .isISO8601()
    .withMessage("Outcome date is required and must be a valid date"),
  body("outcomeNotes").optional().isString().isLength({ max: 2000 }),
];
