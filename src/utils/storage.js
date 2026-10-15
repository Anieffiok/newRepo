import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../config/env.js";
import logger from "../config/logger.js";

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

/**
 * Upload a file buffer to Cloudflare R2 / S3
 */
export async function uploadFileToStorage({ buffer, key, mimeType }) {
  if (!isConfigured || !s3Client) {
    logger.warn(
      { key },
      "Storage credentials not configured. Simulating mock upload",
    );
    return key;
  }

  const command = new PutObjectCommand({
    Bucket: env.storage.bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return key;
}

/**
 * Generate a short-lived presigned download link (valid for 15 minutes)
 */
export async function generateDownloadUrl(key, expiresInSeconds = 900) {
  if (!isConfigured || !s3Client) {
    // Dev fallback: return a mock download link
    return `https://mock-storage.rovia.app/${key}?token=mock-presigned-token`;
  }

  const command = new GetObjectCommand({
    Bucket: env.storage.bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete a file from Cloudflare R2 / S3
 */
export async function deleteFileFromStorage(key) {
  if (!isConfigured || !s3Client) {
    logger.warn(
      { key },
      "Storage credentials not configured. Simulating mock delete",
    );
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: env.storage.bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
