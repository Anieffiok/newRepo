import * as trustService from "./trust.service.js";

export async function getTrustReport(req, res) {
  const report = await trustService.getTrustReport(req.user.id);

  return res.status(200).json({
    success: true,
    data: report,
    message: "Trust report retrieved successfully",
  });
}

export async function getPrivacySettings(req, res) {
  const settings = await trustService.getPrivacySettings(req.user.id);

  return res.status(200).json({
    success: true,
    data: settings,
    message: "Privacy settings retrieved successfully",
  });
}

export async function updatePrivacySettings(req, res) {
  const settings = await trustService.updatePrivacySettings(
    req.user.id,
    req.body,
  );

  return res.status(200).json({
    success: true,
    data: settings,
    message: "Privacy settings updated successfully",
  });
}

export async function requestDeletion(req, res) {
  const request = await trustService.requestDeletion(
    req.user.id,
    req.body.reason,
  );

  return res.status(201).json({
    success: true,
    data: request,
    message:
      "Deletion request submitted. Your data will be reviewed by our team.",
  });
}

export async function cancelDeletion(req, res) {
  const request = await trustService.cancelDeletion(req.user.id, req.params.id);

  return res.status(200).json({
    success: true,
    data: request,
    message: "Deletion request cancelled successfully",
  });
}

export async function getDeletionStatus(req, res) {
  const requests = await trustService.getDeletionStatus(req.user.id);

  return res.status(200).json({
    success: true,
    data: requests,
    message: "Deletion request status retrieved successfully",
  });
}
