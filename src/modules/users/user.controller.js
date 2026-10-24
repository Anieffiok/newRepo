import * as userService from "./user.service.js";

export async function updateMe(req, res) {
  const result = await userService.updateMe(req.user.id, req.body);

  return res.status(200).json({
    success: true,
    data: result,
    message: result.emailVerificationPending
      ? "Profile updated. Please check your new email address to verify it."
      : "Account details updated successfully.",
  });
}

export async function exportUserData(req, res) {
  const exportData = await userService.exportUserData(req.user.id);

  // Set headers so browser treats this response as a downloadable JSON file
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="rovia-data-export-${req.user.id}.json"`,
  );

  return res.status(200).json({
    success: true,
    data: exportData,
    message: "Data export generated successfully.",
  });
}

export async function deleteMe(req, res) {
  await userService.deleteMe(req.user.id, req.body.password);

  // Clear refresh token cookie on client
  res.clearCookie("refreshToken");

  return res.status(200).json({
    success: true,
    data: null,
    message: "Your account and all of your data have been permanently deleted.",
  });
}
