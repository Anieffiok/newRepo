import crypto from "node:crypto";
import { Document } from "../../database/models/index.js";
import {
  uploadFileToStorage,
  generateDownloadUrl,
  deleteFileFromStorage,
} from "../../utils/storage.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Upload a document and create database record
 */
export async function uploadDocument(userId, file, documentType = "OTHER") {
  if (!file) {
    throw new ApiError(400, "VALIDATION_ERROR", "A document file is required");
  }

  // Generate safe storage key: documents/{userId}/{uuid}-{sanitizedFileName}
  const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileId = crypto.randomUUID();
  const storageKey = `documents/${userId}/${fileId}-${cleanName}`;

  // 1. Upload to Cloudflare R2 / S3
  await uploadFileToStorage({
    buffer: file.buffer,
    key: storageKey,
    mimeType: file.mimetype,
  });

  // 2. Save metadata to PostgreSQL
  return Document.create({
    id: fileId,
    userId,
    documentType: documentType || "OTHER",
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storageKey,
    uploadedAt: new Date(),
  });
}

/**
 * List all documents for the authenticated user
 */
export async function getDocuments(userId) {
  return Document.findAll({
    where: { userId },
    attributes: [
      "id",
      "documentType",
      "fileName",
      "mimeType",
      "sizeBytes",
      "uploadedAt",
      "createdAt",
    ],
    order: [["uploadedAt", "DESC"]],
  });
}

/**
 * Generate a short-lived download link for a document (with ownership check)
 */
export async function getDocumentDownloadUrl(userId, documentId) {
  const document = await Document.findOne({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Document not found or does not belong to you",
    );
  }

  const downloadUrl = await generateDownloadUrl(document.storageKey, 900); // 15 mins

  return {
    document: {
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
    },
    downloadUrl,
    expiresInSeconds: 900,
  };
}

/**
 * Delete a document from storage and database (with ownership check)
 */
export async function deleteDocument(userId, documentId) {
  const document = await Document.findOne({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Document not found or does not belong to you",
    );
  }

  // 1. Delete from Cloudflare R2 / S3
  await deleteFileFromStorage(document.storageKey);

  // 2. Delete database row
  await document.destroy();
}
