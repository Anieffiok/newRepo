import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "./auth.controller.js";
import {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} from "./auth.validator.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message:
        "Too many authentication attempts. Please try again in 15 minutes.",
    },
  },
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Creates a new user and an associated empty profile. Returns JWT access and refresh tokens.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
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
 *                 example: ayomide@rovia.app
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already exists
 *       400:
 *         description: Validation error
 */
router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  asyncHandler(authController.register),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and receive tokens
 *     description: Validates credentials and returns JWT access token, refresh token, and user data.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ayomide@rovia.app
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validate,
  asyncHandler(authController.login),
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh expired access token
 *     description: Exchanges a valid refresh token for a new access token.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 9a55a0afe4019d120d618776e291...
 *     responses:
 *       200:
 *         description: Access token refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh",
  refreshValidator,
  validate,
  asyncHandler(authController.refresh),
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke refresh token and log out
 *     description: Invalidates the current refresh token session.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", asyncHandler(authController.logout));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     description: Sends a password reset email if the account exists. Always returns 200 to prevent user enumeration.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ayomide@rovia.app
 *     responses:
 *       200:
 *         description: Reset link sent if account exists
 */
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidator,
  validate,
  asyncHandler(authController.forgotPassword),
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     description: Validates the reset token and updates the user password. Revokes all active sessions.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f6...
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidator,
  validate,
  asyncHandler(authController.resetPassword),
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Confirms a user's email using the token received in the verification email.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token invalid (TOKEN_INVALID) or expired (TOKEN_EXPIRED)
 */
router.post(
  "/verify-email",
  verifyEmailValidator,
  validate,
  asyncHandler(authController.verifyEmail),
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     description: Generates a new verification link and sends it to the user's email.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent if eligible
 */
router.post(
  "/resend-verification",
  authLimiter,
  resendVerificationValidator,
  validate,
  asyncHandler(authController.resendVerification),
);

export default router;
