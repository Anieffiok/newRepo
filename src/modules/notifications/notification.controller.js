import * as notificationService from "./notification.service.js";

export async function getSettings(req, res) {
  const settings = await notificationService.getSettings(req.user.id);

  return res.status(200).json({
    success: true,
    data: settings,
    message: "Notification settings retrieved successfully",
  });
}

export async function updateSettings(req, res) {
  const updated = await notificationService.updateSettings(
    req.user.id,
    req.body.preferences,
  );

  return res.status(200).json({
    success: true,
    data: updated,
    message: "Notification preferences updated successfully",
  });
}
