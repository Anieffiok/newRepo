import { body } from "express-validator";

export const updateSettingsValidator = [
  body("preferences")
    .isArray({ min: 1 })
    .withMessage("Preferences must be an array of settings"),

  body("preferences.*.channel")
    .isIn(["EMAIL", "IN_APP"])
    .withMessage("Channel must be EMAIL or IN_APP"),

  body("preferences.*.type")
    .isIn([
      "DEADLINES",
      "OPPORTUNITIES",
      "APPLICATION_UPDATES",
      "SECURITY_ALERTS",
    ])
    .withMessage("Invalid notification type"),

  body("preferences.*.enabled")
    .isBoolean()
    .withMessage("Enabled must be true or false"),
];
