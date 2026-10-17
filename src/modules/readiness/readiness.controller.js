import * as readinessService from "./readiness.service.js";

export async function analyseReadiness(req, res) {
  const result = await readinessService.analyseReadiness(
    req.user.id,
    req.body.opportunityId,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Readiness analysis completed",
  });
}

export async function getReadinessResult(req, res) {
  const result = await readinessService.getReadinessResult(
    req.params.id,
    req.user.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Readiness result retrieved",
  });
}

export async function updateReadinessItem(req, res) {
  const result = await readinessService.updateReadinessItem(
    req.params.id,
    req.params.itemId,
    req.user.id,
    req.body.status,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Readiness item updated",
  });
}
