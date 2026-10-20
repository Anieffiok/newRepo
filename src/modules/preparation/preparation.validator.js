import { query } from "express-validator";

export const checklistValidator = [
  query("opportunityId")
    .isUUID()
    .withMessage("Opportunity ID must be a valid UUID"),
];
