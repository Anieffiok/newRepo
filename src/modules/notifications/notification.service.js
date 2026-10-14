import {
  sequelize,
  NotificationPreference,
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
