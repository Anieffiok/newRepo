import { body } from "express-validator";

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
