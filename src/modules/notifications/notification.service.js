import {
  sequelize,
  NotificationPreference,
  Notification,
} from "../../database/models/index.js";

const DEFAULT_SETTINGS = [
  { channel: "EMAIL", type: "DEADLINES", enabled: true },
  { channel: "EMAIL", type: "SECURITY_ALERTS", enabled: true },
  { channel: "EMAIL", type: "OPPORTUNITIES", enabled: false },
  { channel: "EMAIL", type: "APPLICATION_UPDATES", enabled: true },
  { channel: "IN_APP", type: "DEADLINES", enabled: true },
  { channel: "IN_APP", type: "SECURITY_ALERTS", enabled: true },
  { channel: "IN_APP", type: "OPPORTUNITIES", enabled: true },
  { channel: "IN_APP", type: "APPLICATION_UPDATES", enabled: true },
];

/**
 * Get user's notification preferences. If empty, returns default matrix.
 */
export async function getSettings(userId) {
  const existing = await NotificationPreference.findAll({
    where: { userId },
  });

  if (existing.length === 0) {
    return DEFAULT_SETTINGS.map((d) => ({ ...d, userId }));
  }

  return existing;
}

/**
 * Bulk update/upsert user's notification preferences
 */
export async function updateSettings(userId, preferencesList) {
  return sequelize.transaction(async (t) => {
    const results = [];

    for (const item of preferencesList) {
      const [record] = await NotificationPreference.upsert(
        {
          userId,
          channel: item.channel,
          type: item.type,
          enabled: item.enabled,
        },
        { transaction: t },
      );
      results.push(record);
    }

    return getSettings(userId);
  });
}

// ─── Notification CRUD (Screen C2) ──────────────────────────────

/**
 * Create a notification for a user.
 * Called internally by other modules (cron jobs, application updates, etc.)
 */
export async function createNotification(userId, data) {
  return Notification.create({
    userId,
    type: data.type,
    title: data.title,
    body: data.body,
    relatedEntityType: data.relatedEntityType || null,
    relatedEntityId: data.relatedEntityId || null,
  });
}

/**
 * List notifications for a user with pagination and unread count.
 */
export async function listNotifications(userId, query) {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "20", 10);
  const offset = (page - 1) * limit;

  const where = { userId };

  if (query.unreadOnly === "true") {
    where.isRead = false;
  }

  if (query.type) {
    where.type = query.type;
  }

  const [notifications, totalItems, unreadCount] = await Promise.all([
    Notification.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    }),
    Notification.count({ where }),
    Notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      limit,
    },
  };
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    const ApiError = (await import("../../utils/ApiError.js")).default;
    throw new ApiError(404, "NOT_FOUND", "Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  return notification;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId) {
  const [count] = await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } },
  );

  return { markedCount: count };
}
