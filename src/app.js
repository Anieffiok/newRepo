import { setupSwagger } from "./docs/swagger.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import env from "./config/env.js";
import logger from "./config/logger.js";
import requestId from "./middleware/requestId.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import routes from "./routes/index.js";

const app = express();

// 1. Security headers
app.disable("x-powered-by");
app.use(helmet());

// 2. CORS
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);

// 3. Request ID + Logging with PII Header Sanitization
app.use(requestId);
app.use(pinoHttp({ logger }));

// 4. Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// 5. Rate limiting (Disabled during automated testing to prevent 429 errors)
if (env.nodeEnv !== "test") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests, please try again later",
        },
      },
    }),
  );
}

// Swagger API Documentation (only in development and staging)
if (env.nodeEnv !== "production") {
  setupSwagger(app);
}

// 6. API routes
app.use("/api/v1", routes);

// 7. Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 8. Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
