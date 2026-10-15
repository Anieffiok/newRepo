import { body, param } from "express-validator";

const canonicalProficiencyLevels = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];
const legacyProficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

const skillFields = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Skill name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Skill name cannot exceed 100 characters"),
  body("proficiency")
    .optional()
    .isIn(canonicalProficiencyLevels)
    .withMessage("Proficiency must be BEGINNER, INTERMEDIATE, ADVANCED, or EXPERT"),
  body("proficiencyLevel")
    .optional()
    .isIn(legacyProficiencyLevels)
    .withMessage("Invalid proficiency level"),
  body("evidence")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Evidence cannot exceed 2000 characters"),
];

export const createSkillValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Skill name is required")
    .isLength({ max: 100 })
    .withMessage("Skill name cannot exceed 100 characters"),
  ...skillFields.slice(1),
];

export const updateSkillValidator = [
  param("id").isUUID().withMessage("Invalid skill ID format"),
  ...skillFields,
];

export const idParamValidator = [
  param("id").isUUID().withMessage("Invalid skill ID format"),
];
