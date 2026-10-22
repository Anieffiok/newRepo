import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Experience,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Experience",
    lastName: "Test",
    email: `experience-${randomUUID()}@rovia.app`,
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
    await Experience.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Experience endpoints", () => {
  it("requires authentication to list and create experience records", async () => {
    const listResponse = await request(app).get("/api/v1/profile/experience");
    const createResponse = await request(app)
      .post("/api/v1/profile/experience")
      .send({
        organisation: "Rovia",
        title: "Engineer",
      });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it("creates and lists experience records for the authenticated user", async () => {
    const payload = {
      type: "WORK",
      organisation: "Rovia",
      title: "Backend Engineer",
      description: "Built APIs and services.",
      location: "Lagos",
      country: "Nigeria",
      startDate: "2023-01-01",
      endDate: "2024-12-31",
      isCurrent: false,
    };

    const createResponse = await request(app)
      .post("/api/v1/profile/experience")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toMatchObject({
      ...payload,
      type: "WORK",
    });

    const listResponse = await request(app)
      .get("/api/v1/profile/experience")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].organisation).toBe(payload.organisation);
  });

  it("updates an experience and validates current-date constraints", async () => {
    const createResponse = await request(app)
      .post("/api/v1/profile/experience")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        organisation: "Google",
        title: "Software Engineer",
        startDate: "2022-01-01",
        endDate: "2023-12-31",
        isCurrent: false,
      });

    const experienceId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .put(`/api/v1/profile/experience/${experienceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Senior Software Engineer" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.title).toBe("Senior Software Engineer");

    const invalidCurrentResponse = await request(app)
      .put(`/api/v1/profile/experience/${experienceId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isCurrent: true, endDate: "2024-01-01" });

    expect(invalidCurrentResponse.status).toBe(400);
    expect(invalidCurrentResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("prevents another user from updating or deleting an experience record", async () => {
    const createResponse = await request(app)
      .post("/api/v1/profile/experience")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        organisation: "Microsoft",
        title: "Data Analyst",
      });

    const experienceId = createResponse.body.data.id;
    const otherUser = await registerUser();

    const updateResponse = await request(app)
      .put(`/api/v1/profile/experience/${experienceId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ title: "Unauthorized title" });

    const deleteResponse = await request(app)
      .delete(`/api/v1/profile/experience/${experienceId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    const listResponse = await request(app)
      .get("/api/v1/profile/experience")
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it("validates required fields and invalid experience IDs", async () => {
    const invalidCreateResponse = await request(app)
      .post("/api/v1/profile/experience")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        organisation: "   ",
        title: "",
        startDate: "not-a-date",
        isCurrent: "yes",
      });

    const invalidIdResponse = await request(app)
      .put(`/api/v1/profile/experience/${randomUUID().replace(/-/g, "")}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated" });

    expect(invalidCreateResponse.status).toBe(400);
    expect(invalidCreateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for unknown experience records", async () => {
    const unknownId = randomUUID();

    const updateResponse = await request(app)
      .put(`/api/v1/profile/experience/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Missing" });

    const deleteResponse = await request(app)
      .delete(`/api/v1/profile/experience/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
