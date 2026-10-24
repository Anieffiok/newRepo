import { Router } from "express";
import * as userController from "./user.controller.js";
import { updateMeValidator, deleteMeValidator } from "./user.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update account information
 *     description: Updates first name, last name, or email. Changing email triggers a new verification email.
 *     tags: [Users & Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Ayomide
 *               lastName:
 *                 type: string
 *                 example: Okeleye
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@rovia.app
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       409:
 *         description: Email already in use
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/me",
  updateMeValidator,
  validate,
  asyncHandler(userController.updateMe),
);

/**
 * @swagger
 * /users/export:
 *   get:
 *     summary: Export all personal account data
 *     description: Returns a downloadable JSON document containing all user profile, education, skills, and application data (GDPR/NDPR data portability).
 *     tags: [Users & Account]
 *     responses:
 *       200:
 *         description: Data export JSON generated
 *       401:
 *         description: Unauthorized
 */
router.get("/export", asyncHandler(userController.exportUserData));

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Deactivate user account
 *     description: Requires current password to confirm account deactivation and session revocation.
 *     tags: [Users & Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Account and all data permanently deleted
 *       401:
 *         description: Incorrect password
 */
router.delete(
  "/me",
  deleteMeValidator,
  validate,
  asyncHandler(userController.deleteMe),
);

export default router;
