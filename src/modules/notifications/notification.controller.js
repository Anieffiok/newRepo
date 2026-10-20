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

export async function listNotifications(req, res) {
  const result = await notificationService.listNotifications(
    req.user.id,
    req.query,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Notifications retrieved successfully",
  });
}

export async function markAsRead(req, res) {
  const notification = await notificationService.markAsRead(
    req.user.id,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    data: notification,
    message: "Notification marked as read",
  });
}

export async function markAllAsRead(req, res) {
  const result = await notificationService.markAllAsRead(req.user.id);

  return res.status(200).json({
    success: true,
    data: result,
    message: "All notifications marked as read",
  });
}
