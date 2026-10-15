import { Router } from "express";
import * as documentController from "./document.controller.js";
import {
  uploadMiddleware,
  createDocumentValidator,
  documentIdParamValidator,
} from "./document.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List all user documents
 *     description: Returns metadata of all uploaded documents (CV, Certificates, Transcripts) for the authenticated user (Screen B14).
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", asyncHandler(documentController.getDocuments));

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Upload a document (CV, Certificate, Transcript)
 *     description: Uploads a PDF, PNG, or JPG file (max 5MB) to Cloudflare R2 / S3 storage (Screen B14).
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, PNG, JPG only, max 5MB)
 *               documentType:
 *                 type: string
 *                 enum: [CV, CERTIFICATE, TRANSCRIPT, OTHER]
 *                 example: CV
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file type or validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  uploadMiddleware,
  createDocumentValidator,
  validate,
  asyncHandler(documentController.uploadDocument),
);

/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     summary: Get temporary secure download link
 *     description: Generates a short-lived presigned URL (valid for 15 minutes) to download a private document (Screen B14).
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Presigned download link generated
 *       404:
 *         description: Document not found or not owned by user
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/:id/download",
  documentIdParamValidator,
  validate,
  asyncHandler(documentController.getDocumentDownloadUrl),
);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Deletes a document from cloud storage and removes its record from the database (Screen B14).
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found or not owned by user
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:id",
  documentIdParamValidator,
  validate,
  asyncHandler(documentController.deleteDocument),
);

export default router;
