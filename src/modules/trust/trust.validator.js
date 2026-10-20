import { body, param } from "express-validator";

export const updatePrivacyValidator = [
  body("profileVisibility")
    .optional()
    .isIn(["PUBLIC", "PRIVATE"])
    .withMessage("Visibility must be PUBLIC or PRIVATE"),
  body("showEducation")
    .optional()
    .isBoolean()
    .withMessage("showEducation must be true or false"),
  body("showExperience")
    .optional()
    .isBoolean()
    .withMessage("showExperience must be true or false"),
  body("showSkills")
    .optional()
    .isBoolean()
    .withMessage("showSkills must be true or false"),
  body("showCertifications")
    .optional()
    .isBoolean()
    .withMessage("showCertifications must be true or false"),
  body("showApplications")
    .optional()
    .isBoolean()
    .withMessage("showApplications must be true or false"),
];

export const deletionRequestValidator = [
  body("reason")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Reason must be a string of 500 characters or less"),
];

export const deletionIdParamValidator = [
  param("id").isUUID().withMessage("Request ID must be a valid UUID"),
];
