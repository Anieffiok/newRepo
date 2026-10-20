import * as learningService from "./learning.service.js";

export async function listResources(req, res) {
  const result = await learningService.listResources(req.query);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Learning resources retrieved successfully",
  });
}

export async function getSuggestedResources(req, res) {
  const result = await learningService.getSuggestedResources(req.user.id);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Suggested resources retrieved successfully",
  });
}

export async function saveResource(req, res) {
  const learning = await learningService.saveResource(
    req.user.id,
    req.params.resourceId,
  );

  return res.status(201).json({
    success: true,
    data: learning,
    message: "Resource saved to your learning list",
  });
}

export async function updateLearningStatus(req, res) {
  const learning = await learningService.updateLearningStatus(
    req.user.id,
    req.params.resourceId,
    req.body.status,
  );

  return res.status(200).json({
    success: true,
    data: learning,
    message: "Learning status updated successfully",
  });
}

export async function listMyLearning(req, res) {
  const learning = await learningService.listMyLearning(req.user.id);

  return res.status(200).json({
    success: true,
    data: learning,
    message: "Your learning list retrieved successfully",
  });
}
