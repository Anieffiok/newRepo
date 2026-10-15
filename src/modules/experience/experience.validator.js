import { body, param } from "express-validator";

const optionalExperienceFields = () => [
  body("type")
    .optional()
    .isIn(["WORK", "INTERNSHIP", "PROJECT", "VOLUNTEERING", "OTHER"])
    .withMessage("Invalid experience type"),
  body("organisation")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organisation cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Organisation cannot exceed 255 characters"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters"),
  body("description").optional({ nullable: true }).isString(),
  body("location")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Location cannot exceed 255 characters"),
  body("country")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),
  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("isCurrent").optional().isBoolean().toBoolean(),
];

export const createExperienceValidator = [
  body("organisation")
    .trim()
    .notEmpty()
    .withMessage("Organisation is required")
    .isLength({ max: 255 })
    .withMessage("Organisation cannot exceed 255 characters"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters"),
  ...optionalExperienceFields(),
];

export const updateExperienceValidator = [
  param("id").isUUID().withMessage("Invalid experience ID format"),
  ...optionalExperienceFields(),
];

export const idParamValidator = [
  param("id").isUUID().withMessage("Invalid experience ID format"),
];
