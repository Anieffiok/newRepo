import { body } from "express-validator";

export const updateMeValidator = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters"),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Last name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const deleteMeValidator = [
  body("password")
    .notEmpty()
    .withMessage("Current password is required to delete your account"),
];
