import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Notification,
  NotificationPreference,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Notification",
    lastName: "Test",
    email: `notification-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  userIds = [];
  const user = await registerUser();
  accessToken = user.accessToken;
});

afterEach(async () => {
  if (userIds.length > 0) {
    await Notification.destroy({ where: { userId: userIds } });
    await NotificationPreference.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Notification endpoints", () => {
  it("requires authentication for settings and notifications", async () => {
    const settingsResponse = await request(app).get("/api/v1/notifications/settings");
    const notificationsResponse = await request(app).get("/api/v1/notifications");

    expect(settingsResponse.status).toBe(401);
    expect(notificationsResponse.status).toBe(401);
  });

  it("returns default settings and updates preferences", async () => {
    const settingsResponse = await request(app)
      .get("/api/v1/notifications/settings")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(settingsResponse.status).toBe(200);
    expect(settingsResponse.body.success).toBe(true);
    expect(settingsResponse.body.data.length).toBeGreaterThan(0);

    const updateResponse = await request(app)
      .put("/api/v1/notifications/settings")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        preferences: [
          { channel: "EMAIL", type: "OPPORTUNITIES", enabled: true },
          { channel: "IN_APP", type: "APPLICATION_UPDATES", enabled: false },
        ],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: "EMAIL", type: "OPPORTUNITIES", enabled: true }),
      ]),
    );
  });

  it("creates, lists, and marks notifications as read", async () => {
    const createResponse = await Notification.create({
      userId: userIds[0],
      type: "DEADLINES",
      title: "Deadline reminder",
      body: "Your opportunity deadline is approaching.",
      relatedEntityType: "OPPORTUNITY",
      relatedEntityId: randomUUID(),
    });

    const listResponse = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ unreadOnly: "true", type: "DEADLINES" });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.notifications).toHaveLength(1);
    expect(listResponse.body.data.unreadCount).toBe(1);

    const readResponse = await request(app)
      .patch(`/api/v1/notifications/${createResponse.id}/read`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data.isRead).toBe(true);

    const allReadResponse = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(allReadResponse.status).toBe(200);
    expect(allReadResponse.body.data.markedCount).toBeGreaterThanOrEqual(0);
  });

  it("validates settings and notification IDs", async () => {
    const invalidSettingsResponse = await request(app)
      .put("/api/v1/notifications/settings")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ preferences: [{ channel: "SMS", type: "DEADLINES", enabled: true }] });

    const invalidIdResponse = await request(app)
      .patch(`/api/v1/notifications/${randomUUID().replace(/-/g, "")}/read`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(invalidSettingsResponse.status).toBe(400);
    expect(invalidSettingsResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for a missing notification", async () => {
    const unknownId = randomUUID();
    const response = await request(app)
      .patch(`/api/v1/notifications/${unknownId}/read`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });
});
