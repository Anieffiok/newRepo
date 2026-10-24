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
