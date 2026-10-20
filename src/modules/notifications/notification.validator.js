import { body, param, query } from "express-validator";

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

export const notificationIdParamValidator = [
  param("id").isUUID().withMessage("Notification ID must be a valid UUID"),
];

export const listNotificationsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("unreadOnly")
    .optional()
    .isIn(["true", "false"])
    .withMessage("unreadOnly must be true or false"),
  query("type")
    .optional()
    .isIn([
      "DEADLINES",
      "OPPORTUNITIES",
      "APPLICATION_UPDATES",
      "SECURITY_ALERTS",
    ])
    .withMessage("Invalid notification type"),
];
