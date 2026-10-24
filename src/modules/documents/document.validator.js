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

const singleFileUpload = multer({
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

// Wrap multer so an oversized file returns a 400 ApiError instead of a 500
export function uploadMiddleware(req, res, next) {
  singleFileUpload(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new ApiError(400, "FILE_TOO_LARGE", "File must be 5 MB or smaller"),
      );
    }
    return next(err);
  });
}

export const createDocumentValidator = [
  body("documentType")
    .optional()
    .isIn(["CV", "CERTIFICATE", "TRANSCRIPT", "OTHER"])
    .withMessage("Document type must be CV, CERTIFICATE, TRANSCRIPT, or OTHER"),
];

export const documentIdParamValidator = [
  param("id").isUUID().withMessage("Invalid document ID format"),
];
