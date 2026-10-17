import * as applicationService from "./application.service.js";

export async function listApplications(req, res) {
  const applications = await applicationService.listApplications(
    req.user.id,
    req.query,
  );

  return res.status(200).json({
    success: true,
    data: applications,
    message: "Applications retrieved successfully",
  });
}

export async function createApplication(req, res) {
  const application = await applicationService.createApplication(
    req.user.id,
    req.body,
  );

  return res.status(201).json({
    success: true,
    data: application,
    message: "Application created successfully",
  });
}

export async function getApplication(req, res) {
  const application = await applicationService.getApplicationById(
    req.params.id,
    req.user.id,
  );

  return res.status(200).json({
    success: true,
    data: application,
    message: "Application retrieved successfully",
  });
}

export async function updateApplication(req, res) {
  const application = await applicationService.updateApplication(
    req.params.id,
    req.user.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    data: application,
    message: "Application updated successfully",
  });
}

export async function addStage(req, res) {
  const application = await applicationService.addStage(
    req.params.id,
    req.user.id,
    req.body,
  );

  return res.status(201).json({
    success: true,
    data: application,
    message: "Stage added successfully",
  });
}

export async function updateStage(req, res) {
  const application = await applicationService.updateStage(
    req.params.id,
    req.params.stageId,
    req.user.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    data: application,
    message: "Stage updated successfully",
  });
}

export async function recordOutcome(req, res) {
  const application = await applicationService.recordOutcome(
    req.params.id,
    req.user.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    data: application,
    message: "Outcome recorded successfully",
  });
}
