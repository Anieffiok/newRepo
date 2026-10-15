import { body, param } from "express-validator";

const educationFields = [
  body("institution")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Institution cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Institution cannot exceed 255 characters"),
  body("qualification")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Qualification cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Qualification cannot exceed 255 characters"),
  body("fieldOfStudy")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Field of study cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Field of study cannot exceed 255 characters"),
  body("startDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("country")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),
];

export const createEducationValidator = [
  body("institution")
    .trim()
    .notEmpty()
    .withMessage("Institution is required")
    .isLength({ max: 255 })
    .withMessage("Institution cannot exceed 255 characters"),
  body("qualification")
    .trim()
    .notEmpty()
    .withMessage("Qualification is required")
    .isLength({ max: 255 })
    .withMessage("Qualification cannot exceed 255 characters"),
  body("fieldOfStudy")
    .trim()
    .notEmpty()
    .withMessage("Field of study is required")
    .isLength({ max: 255 })
    .withMessage("Field of study cannot exceed 255 characters"),
  ...educationFields.slice(3),
];

export const updateEducationValidator = [
  param("id").isUUID().withMessage("Invalid education ID format"),
  ...educationFields,
];

export const idParamValidator = [
  param("id").isUUID().withMessage("Invalid education ID format"),
];
