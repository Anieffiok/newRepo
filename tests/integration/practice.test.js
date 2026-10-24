import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Opportunity,
  PracticeSession,
} from "../../src/database/models/index.js";
import aiService from "../../src/modules/ai/ai.service.js";

let accessToken;
let userIds = [];
let opportunityIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Practice",
    lastName: "Tester",
    email: `practice-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

async function createOpportunity(overrides = {}) {
  const opportunity = await Opportunity.create({
    title: "Senior Software Engineer",
    organisation: "Rovia Labs",
    type: "JOB",
    country: "Nigeria",
    location: "Lagos",
    deadline: "2030-12-31",
    ...overrides,
  });

  opportunityIds.push(opportunity.id);
  return opportunity;
}

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  userIds = [];
  opportunityIds = [];

  const user = await registerUser();
  accessToken = user.accessToken;

  jest.spyOn(aiService, "generatePracticeQuestions").mockResolvedValue(
    "1. Tell me about yourself and what motivates you?\n" +
      "2. What are your strongest technical skills and how have you used them?\n" +
      "3. Describe a project you led and the impact it had.\n" +
      "4. Why do you want to work in this role?\n" +
      "5. What are your career goals over the next few years?",
  );
});

afterEach(async () => {
  if (opportunityIds.length > 0) {
    await PracticeSession.destroy({
      where: { opportunityId: opportunityIds },
    });
    await Opportunity.destroy({ where: { id: opportunityIds } });
  }

  if (userIds.length > 0) {
    await User.destroy({ where: { id: userIds } });
  }

  jest.restoreAllMocks();
  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Practice endpoints", () => {
  it("requires authentication to list and generate practice sessions", async () => {
    const listResponse = await request(app).get("/api/v1/practice");
    const generateResponse = await request(app)
      .post("/api/v1/practice/generate")
      .send({ opportunityId: randomUUID() });

    expect(listResponse.status).toBe(401);
    expect(generateResponse.status).toBe(401);
  });

  it("generates, lists, and reads a practice session for the authenticated user", async () => {
    const opportunity = await createOpportunity();

    const createResponse = await request(app)
      .post("/api/v1/practice/generate")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.opportunity.id).toBe(opportunity.id);
    expect(createResponse.body.data.questions).toHaveLength(5);
    expect(createResponse.body.data.status).toBe("GENERATED");

    const listResponse = await request(app)
      .get("/api/v1/practice")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].opportunity.id).toBe(opportunity.id);

    const sessionId = createResponse.body.data.id;
    const detailResponse = await request(app)
      .get(`/api/v1/practice/${sessionId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.id).toBe(sessionId);
    expect(detailResponse.body.data.questions[0].text).toContain("yourself");
  });

  it("updates session status and rejects invalid status values", async () => {
    const opportunity = await createOpportunity();

    const createResponse = await request(app)
      .post("/api/v1/practice/generate")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    const sessionId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .patch(`/api/v1/practice/${sessionId}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "IN_PROGRESS" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe("IN_PROGRESS");

    const invalidStatusResponse = await request(app)
      .patch(`/api/v1/practice/${sessionId}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "DONE" });

    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("validates UUIDs and invalid request bodies", async () => {
    const invalidGenerateResponse = await request(app)
      .post("/api/v1/practice/generate")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: "not-a-uuid" });

    const invalidIdResponse = await request(app)
      .get(`/api/v1/practice/${randomUUID().replace(/-/g, "")}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const invalidStatusResponse = await request(app)
      .patch(`/api/v1/practice/${randomUUID()}/status`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "FINISHED" });

    expect(invalidGenerateResponse.status).toBe(400);
    expect(invalidGenerateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when another user tries to access a practice session", async () => {
    const opportunity = await createOpportunity();

    const createResponse = await request(app)
      .post("/api/v1/practice/generate")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    const sessionId = createResponse.body.data.id;
    const otherUser = await registerUser();

    const otherSessionResponse = await request(app)
      .get(`/api/v1/practice/${sessionId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    const otherStatusResponse = await request(app)
      .patch(`/api/v1/practice/${sessionId}/status`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ status: "COMPLETED" });

    const otherListResponse = await request(app)
      .get("/api/v1/practice")
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(otherSessionResponse.status).toBe(404);
    expect(otherStatusResponse.status).toBe(404);
    expect(otherListResponse.status).toBe(200);
    expect(otherListResponse.body.data).toHaveLength(0);
  });
});
