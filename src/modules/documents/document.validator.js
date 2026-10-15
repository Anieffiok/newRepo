import multer from "multer";
import { body, param } from "express-validator";
import ApiError from "../../utils/ApiError.js";

// Configure Multer memory storage (keep file buffer in RAM)
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit per file

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "INVALID_FILE_TYPE",
          "Only PDF, PNG, and JPG files are permitted",
        ),
        false,
      );
    }
  },
}).single("file"); // Expects single file upload under form-data key "file"

export const createDocumentValidator = [
  body("documentType")
    .optional()
    .isIn(["CV", "CERTIFICATE", "TRANSCRIPT", "OTHER"])
    .withMessage("Document type must be CV, CERTIFICATE, TRANSCRIPT, or OTHER"),
];

export const documentIdParamValidator = [
  param("id").isUUID().withMessage("Invalid document ID format"),
];
