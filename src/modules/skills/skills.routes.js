import { Router } from "express";
import skillsController from "./skills.controller.js";
import {
  createSkillValidator,
  updateSkillValidator,
  idParamValidator,
} from "./skills.validator.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .post(
    createSkillValidator,
    validate,
    asyncHandler((req, res) => skillsController.create(req, res)),
  )
  .get(asyncHandler((req, res) => skillsController.getAll(req, res)));

router
  .route("/:id")
  .get(
    idParamValidator,
    validate,
    asyncHandler((req, res) => skillsController.getById(req, res)),
  )
  .put(
    updateSkillValidator,
    validate,
    asyncHandler((req, res) => skillsController.update(req, res)),
  )
  .delete(
    idParamValidator,
    validate,
    asyncHandler((req, res) => skillsController.delete(req, res)),
  );

export default router;
