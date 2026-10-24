import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  LearningResource,
  UserLearning,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Learning",
    lastName: "Test",
    email: `learning-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

async function createResource() {
  const response = await LearningResource.create({
    title: `Learning Resource ${randomUUID()}`,
    description: "Resource created for integration tests",
    provider: "Coursera",
    url: "https://example.com/resource",
    skillCategory: "AI",
    difficulty: "BEGINNER",
    isFree: true,
    durationEstimate: "2 hours",
    countryFocus: "Nigeria",
  });

  return response;
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
    await UserLearning.destroy({ where: { userId: userIds } });
    const resourceIds = (
      await LearningResource.findAll({
        where: { title: { [sequelize.Sequelize.Op.like]: "Learning Resource %" } },
        attributes: ["id"],
      })
    ).map((resource) => resource.id);
    if (resourceIds.length > 0) {
      await LearningResource.destroy({ where: { id: resourceIds } });
    }
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Learning endpoints", () => {
  it("requires authentication for learning routes", async () => {
    const listResponse = await request(app).get("/api/v1/learning");
    const myLearningResponse = await request(app).get("/api/v1/learning/my");
    const saveResponse = await request(app)
      .post(`/api/v1/learning/${randomUUID()}/save`);

    expect(listResponse.status).toBe(401);
    expect(myLearningResponse.status).toBe(401);
    expect(saveResponse.status).toBe(401);
  });

  it("lists learning resources with filters and pagination", async () => {
    await createResource();

    const response = await request(app)
      .get("/api/v1/learning")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ page: 1, limit: 10, skillCategory: "AI", difficulty: "BEGINNER", freeOnly: "true" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.resources.length).toBeGreaterThan(0);
    expect(response.body.data.pagination).toHaveProperty("totalItems");
  });

  it("saves a resource to the user's learning list and updates its status", async () => {
    const resource = await createResource();

    const saveResponse = await request(app)
      .post(`/api/v1/learning/${resource.id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(saveResponse.status).toBe(201);
    expect(saveResponse.body.success).toBe(true);
    expect(saveResponse.body.data.status).toBe("SAVED");

    const statusResponse = await request(app)
      .patch(`/api/v1/learning/${resource.id}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "IN_PROGRESS" });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.status).toBe("IN_PROGRESS");

    const myListResponse = await request(app)
      .get("/api/v1/learning/my")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(myListResponse.status).toBe(200);
    expect(myListResponse.body.data).toHaveLength(1);
  });

  it("prevents duplicate saves and rejects invalid status or resource ids", async () => {
    const resource = await createResource();

    await request(app)
      .post(`/api/v1/learning/${resource.id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    const duplicateResponse = await request(app)
      .post(`/api/v1/learning/${resource.id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    const invalidStatusResponse = await request(app)
      .patch(`/api/v1/learning/${resource.id}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "INVALID" });

    const invalidIdResponse = await request(app)
      .patch(`/api/v1/learning/${randomUUID().replace(/-/g, "")}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "COMPLETED" });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe("CONFLICT");
    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for unknown resource ids", async () => {
    const unknownId = randomUUID();

    const saveResponse = await request(app)
      .post(`/api/v1/learning/${unknownId}/save`)
      .set("Authorization", `Bearer ${accessToken}`);
    const statusResponse = await request(app)
      .patch(`/api/v1/learning/${unknownId}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "COMPLETED" });

    expect(saveResponse.status).toBe(404);
    expect(statusResponse.status).toBe(404);
  });
});
