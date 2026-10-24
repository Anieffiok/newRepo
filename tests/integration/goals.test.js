import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  CareerGoal,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Goal",
    lastName: "Test",
    email: `goal-${randomUUID()}@rovia.app`,
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
    await CareerGoal.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Career goal endpoints", () => {
  it("requires authentication to list and create goals", async () => {
    const listResponse = await request(app).get("/api/v1/goals");
    const createResponse = await request(app)
      .post("/api/v1/goals")
      .send({ targetRole: "Senior Backend Engineer" });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it("creates and lists career goals for the authenticated user", async () => {
    const payload = {
      goalType: "Short-term",
      targetRole: "Senior Backend Engineer",
      targetIndustry: "Fintech",
      targetLocation: "Remote",
      priority: "HIGH",
      status: "ACTIVE",
    };

    const createResponse = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toMatchObject(payload);

    const listResponse = await request(app)
      .get("/api/v1/goals")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].targetRole).toBe(payload.targetRole);
  });

  it("updates a goal and rejects invalid status values", async () => {
    const createResponse = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetRole: "Product Manager" });

    const goalId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .put(`/api/v1/goals/${goalId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ priority: "LOW", status: "ACHIEVED" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.priority).toBe("LOW");
    expect(updateResponse.body.data.status).toBe("ACHIEVED");

    const invalidStatusResponse = await request(app)
      .put(`/api/v1/goals/${goalId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "INVALID" });

    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("prevents another user from updating or deleting a goal", async () => {
    const createResponse = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetRole: "Data Scientist" });

    const goalId = createResponse.body.data.id;
    const otherUser = await registerUser();

    const updateResponse = await request(app)
      .put(`/api/v1/goals/${goalId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ targetRole: "Unauthorized role" });

    const deleteResponse = await request(app)
      .delete(`/api/v1/goals/${goalId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    const otherListResponse = await request(app)
      .get("/api/v1/goals")
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(otherListResponse.status).toBe(200);
    expect(otherListResponse.body.data).toHaveLength(0);
  });

  it("validates required fields and invalid goal IDs", async () => {
    const invalidCreateResponse = await request(app)
      .post("/api/v1/goals")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetRole: "   ", status: "INVALID" });

    const invalidIdResponse = await request(app)
      .put(`/api/v1/goals/${randomUUID().replace(/-/g, "")}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetRole: "Updated role" });

    expect(invalidCreateResponse.status).toBe(400);
    expect(invalidCreateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for an unknown goal", async () => {
    const unknownId = randomUUID();

    const updateResponse = await request(app)
      .put(`/api/v1/goals/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetRole: "Unknown" });

    const deleteResponse = await request(app)
      .delete(`/api/v1/goals/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
