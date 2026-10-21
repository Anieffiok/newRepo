import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../config/env.js";
import logger from "../config/logger.js";
import ApiError from "./ApiError.js";

const isConfigured = Boolean(
  env.storage.accessKeyId &&
  env.storage.secretAccessKey &&
  env.storage.endpoint,
);

let s3Client = null;

if (isConfigured) {
  s3Client = new S3Client({
    region: env.storage.region,
    endpoint: env.storage.endpoint,
    credentials: {
      accessKeyId: env.storage.accessKeyId,
      secretAccessKey: env.storage.secretAccessKey,
    },
  });
}

function assertStorageConfigured(operationName) {
  if (!isConfigured || !s3Client) {
    if (env.nodeEnv === "production") {
      const error = new ApiError(
        503,
        "STORAGE_NOT_CONFIGURED",
        `Storage is not configured for ${operationName}.`,
      );
      logger.error({ operationName }, error.message);
      throw error;
    }

    logger.warn(
      { operationName },
      "Storage credentials not configured. Using local dev/test mock behavior.",
    );
  }
}

/**
 * Upload a file buffer to Cloudflare R2 / S3
 */
export async function uploadFileToStorage({ buffer, key, mimeType }) {
  assertStorageConfigured("upload");

  if (!isConfigured || !s3Client) {
    return key;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: env.storage.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    logger.error({ err: error.message, key }, "Storage upload failed");
    throw new ApiError(
      503,
      "STORAGE_UPLOAD_FAILED",
      "Storage upload failed. Please try again later.",
    );
  }
}

/**
 * Generate a short-lived presigned download link (valid for 15 minutes)
 */
export async function generateDownloadUrl(key, expiresInSeconds = 900) {
  assertStorageConfigured("download");

  if (!isConfigured || !s3Client) {
    return `https://mock-storage.rovia.app/${key}?token=mock-presigned-token`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: env.storage.bucketName,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    logger.error({ err: error.message, key }, "Storage download URL generation failed");
    throw new ApiError(
      503,
      "STORAGE_DOWNLOAD_FAILED",
      "Storage download link could not be generated. Please try again later.",
    );
  }
}

/**
 * Delete a file from Cloudflare R2 / S3
 */
export async function deleteFileFromStorage(key) {
  assertStorageConfigured("delete");

  if (!isConfigured || !s3Client) {
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: env.storage.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error({ err: error.message, key }, "Storage delete failed");
    throw new ApiError(
      503,
      "STORAGE_DELETE_FAILED",
      "Storage delete failed. Please try again later.",
    );
  }
}
