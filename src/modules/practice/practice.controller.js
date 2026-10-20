import * as practiceService from "./practice.service.js";

export async function generatePractice(req, res) {
  const session = await practiceService.generatePractice(
    req.user.id,
    req.body.opportunityId,
  );

  return res.status(201).json({
    success: true,
    data: session,
    message: "Practice questions generated successfully",
  });
}

export async function listPracticeSessions(req, res) {
  const sessions = await practiceService.listPracticeSessions(req.user.id);

  return res.status(200).json({
    success: true,
    data: sessions,
    message: "Practice sessions retrieved successfully",
  });
}

export async function getPracticeSession(req, res) {
  const session = await practiceService.getPracticeSession(
    req.params.id,
    req.user.id,
  );

  return res.status(200).json({
    success: true,
    data: session,
    message: "Practice session retrieved successfully",
  });
}

export async function updateSessionStatus(req, res) {
  const session = await practiceService.updateSessionStatus(
    req.params.id,
    req.user.id,
    req.body.status,
  );

  return res.status(200).json({
    success: true,
    data: session,
    message: "Practice session updated successfully",
  });
}
