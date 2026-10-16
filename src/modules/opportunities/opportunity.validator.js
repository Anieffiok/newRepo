import { body, param, query } from "express-validator";

const OPPORTUNITY_TYPES = [
  "JOB",
  "GRADUATE_TRAINEE",
  "INTERNSHIP",
  "FELLOWSHIP",
  "SCHOLARSHIP",
  "APPRENTICESHIP",
  "COMPETITION",
  "TRAINING",
  "VOLUNTEERING",
  "OTHER",
];

const WORK_MODES = ["REMOTE", "HYBRID", "ONSITE"];
const CAREER_LEVELS = [
  "STUDENT",
  "ENTRY_LEVEL",
  "MID_LEVEL",
  "SENIOR",
  "EXECUTIVE",
];
const REQUIREMENT_TYPES = [
  "DEGREE",
  "DISCIPLINE",
  "SKILLS",
  "EXPERIENCE",
  "CERTIFICATIONS",
  "LOCATION",
  "OTHER",
];
const EVIDENCE_SOURCES = ["PUBLISHED", "ROVIA_INTERPRETATION"];

// ─── Discover (D1) ────────────────────────────────────────────────
export const listOpportunitiesValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage("Search query must be under 200 characters"),
  query("type")
    .optional()
    .isString()
    .withMessage("Type must be a comma-separated list of valid types"),
  query("workMode")
    .optional()
    .isIn(WORK_MODES)
    .withMessage("Invalid work mode"),
  query("careerLevel")
    .optional()
    .isIn(CAREER_LEVELS)
    .withMessage("Invalid career level"),
  query("country").optional().isString().isLength({ max: 100 }),
  query("sort")
    .optional()
    .isIn(["deadline", "recent"])
    .withMessage("Sort must be deadline or recent"),
  query("showExpired")
    .optional()
    .isBoolean()
    .withMessage("showExpired must be true or false"),
];

// ─── Opportunity Detail (D2) ──────────────────────────────────────
export const opportunityIdParamValidator = [
  param("id").isUUID().withMessage("Invalid opportunity ID format"),
];

// ─── Bring an Opportunity (D3) ────────────────────────────────────
export const bringOpportunityValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title must be under 255 characters"),
  body("organisation")
    .trim()
    .notEmpty()
    .withMessage("Organisation is required")
    .isLength({ max: 255 })
    .withMessage("Organisation must be under 255 characters"),
  body("type")
    .isIn(OPPORTUNITY_TYPES)
    .withMessage(`Type must be one of: ${OPPORTUNITY_TYPES.join(", ")}`),
  body("description")
    .optional()
    .isString()
    .isLength({ max: 10000 })
    .withMessage("Description must be under 10000 characters"),
  body("industry").optional().isString().isLength({ max: 255 }),
  body("country").optional().isString().isLength({ max: 100 }),
  body("location").optional().isString().isLength({ max: 255 }),
  body("workMode")
    .optional()
    .isIn(WORK_MODES)
    .withMessage("Work mode must be REMOTE, HYBRID, or ONSITE"),
  body("careerLevel")
    .optional()
    .isIn(CAREER_LEVELS)
    .withMessage("Invalid career level"),
  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date (YYYY-MM-DD)"),
  body("applicationUrl")
    .optional()
    .isURL({ require_protocol: true })
    .withMessage("Application URL must be a valid web address"),
  body("sourceUrl")
    .optional()
    .isURL({ require_protocol: true })
    .withMessage("Source URL must be a valid web address"),
  body("requirements")
    .optional()
    .isArray()
    .withMessage("Requirements must be an array"),
  body("requirements.*.type")
    .isIn(REQUIREMENT_TYPES)
    .withMessage("Invalid requirement type"),
  body("requirements.*.description")
    .trim()
    .notEmpty()
    .withMessage("Requirement description is required")
    .isLength({ max: 2000 }),
  body("requirements.*.isRequired").optional().isBoolean(),
  body("requirements.*.evidenceSource")
    .optional()
    .isIn(EVIDENCE_SOURCES)
    .withMessage("Evidence source must be PUBLISHED or ROVIA_INTERPRETATION"),
  body("requirements.*.acceptsAnyDiscipline").optional().isBoolean(),
];
