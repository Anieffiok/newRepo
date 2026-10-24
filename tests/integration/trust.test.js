import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  PrivacySetting,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Trust",
    lastName: "Tester",
    email: `trust-${randomUUID()}@rovia.app`,
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
    await PrivacySetting.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Trust and privacy endpoints", () => {
  it("requires authentication for report and privacy routes", async () => {
    const reportResponse = await request(app).get("/api/v1/trust/report");
    const privacyResponse = await request(app).get("/api/v1/trust/privacy");
    const updateResponse = await request(app)
      .patch("/api/v1/trust/privacy")
      .send({ profileVisibility: "PUBLIC" });

    expect(reportResponse.status).toBe(401);
    expect(privacyResponse.status).toBe(401);
    expect(updateResponse.status).toBe(401);
  });

  it("gets and updates privacy settings", async () => {
    const getResponse = await request(app)
      .get("/api/v1/trust/privacy")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.userId).toBe(userIds[0]);
    expect(getResponse.body.data.profileVisibility).toBe("PRIVATE");

    const updateResponse = await request(app)
      .patch("/api/v1/trust/privacy")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        profileVisibility: "PUBLIC",
        showEducation: false,
        showExperience: true,
        showSkills: true,
        showCertifications: false,
        showApplications: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.profileVisibility).toBe("PUBLIC");
    expect(updateResponse.body.data.showEducation).toBe(false);
    expect(updateResponse.body.data.showApplications).toBe(true);
  });

  it("returns the trust report with account and category summaries", async () => {
    const response = await request(app)
      .get("/api/v1/trust/report")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.account.email).toBeDefined();
    expect(response.body.data.profile.exists).toBe(true);
    expect(response.body.data.summary).toHaveProperty("totalDataPoints");
    expect(Array.isArray(response.body.data.data)).toBe(true);
  });

  it("rejects invalid privacy values", async () => {
    const invalidPrivacyResponse = await request(app)
      .patch("/api/v1/trust/privacy")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ profileVisibility: "SECRET" });

    expect(invalidPrivacyResponse.status).toBe(400);
    expect(invalidPrivacyResponse.body.error.code).toBe("VALIDATION_ERROR");
  });
});
