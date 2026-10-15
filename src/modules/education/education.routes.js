import { Router } from "express";
import educationController from "./education.controller.js";
import {
  createEducationValidator,
  updateEducationValidator,
  idParamValidator,
} from "./education.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .post(
    createEducationValidator,
    validate,
    asyncHandler((req, res) => educationController.create(req, res)),
  )
  .get(asyncHandler((req, res) => educationController.getAll(req, res)));

router
  .route("/:id")
  .get(
    idParamValidator,
    validate,
    asyncHandler((req, res) => educationController.getById(req, res)),
  )
  .put(
    updateEducationValidator,
    validate,
    asyncHandler((req, res) => educationController.update(req, res)),
  )
  .delete(
    idParamValidator,
    validate,
    asyncHandler((req, res) => educationController.delete(req, res)),
  );

export default router;
