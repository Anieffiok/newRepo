import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Opportunity,
  PracticeSession,
  LearningResource,
  UserLearning,
  Document,
  ReadinessResult,
  ReadinessItem,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];
let opportunityIds = [];
let learningResourceIds = [];
let readinessIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Preparation",
    lastName: "Tester",
    email: `preparation-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

async function createOpportunity(overrides = {}) {
  const opportunity = await Opportunity.create({
    title: "Data Analyst",
    organisation: "Rovia Labs",
    type: "JOB",
    country: "Nigeria",
    location: "Remote",
    deadline: "2030-12-31",
    ...overrides,
  });

  opportunityIds.push(opportunity.id);
  return opportunity;
}

async function createLearningResource(overrides = {}) {
  const resource = await LearningResource.create({
    title: "SQL Fundamentals",
    description: "Querying databases and joins.",
    provider: "Coursera",
    url: "https://example.com/sql-fundamentals",
    skillCategory: "Data Analysis",
    difficulty: "BEGINNER",
    isFree: true,
    ...overrides,
  });

  learningResourceIds.push(resource.id);
  return resource;
}

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  userIds = [];
  opportunityIds = [];
  learningResourceIds = [];
  readinessIds = [];

  const user = await registerUser();
  accessToken = user.accessToken;
});

afterEach(async () => {
  if (readinessIds.length > 0) {
    await ReadinessItem.destroy({ where: { readinessResultId: readinessIds } });
    await ReadinessResult.destroy({ where: { id: readinessIds } });
  }

  if (opportunityIds.length > 0) {
    await PracticeSession.destroy({ where: { opportunityId: opportunityIds } });
    await Opportunity.destroy({ where: { id: opportunityIds } });
  }

  if (learningResourceIds.length > 0) {
    await UserLearning.destroy({ where: { resourceId: learningResourceIds } });
    await LearningResource.destroy({ where: { id: learningResourceIds } });
  }

  if (userIds.length > 0) {
    await Document.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Preparation checklist endpoints", () => {
  it("requires authentication and validates the opportunityId query parameter", async () => {
    const unauthenticatedResponse = await request(app).get(
      "/api/v1/preparation/checklist",
    );

    const invalidOpportunityResponse = await request(app)
      .get("/api/v1/preparation/checklist")
      .query({ opportunityId: "invalid-id" })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(unauthenticatedResponse.status).toBe(401);
    expect(invalidOpportunityResponse.status).toBe(400);
    expect(invalidOpportunityResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns a unified preparation checklist for the authenticated user", async () => {
    const opportunity = await createOpportunity();
    const resource = await createLearningResource();

    const readinessResult = await ReadinessResult.create({
      userId: userIds[0],
      opportunityId: opportunity.id,
      state: "NEEDS_PREPARATION",
      summary: "Improve SQL and portfolio clarity.",
    });
    readinessIds.push(readinessResult.id);

    await ReadinessItem.create({
      readinessResultId: readinessResult.id,
      itemType: "SKILL",
      status: "PENDING",
      priority: "HIGH",
      title: "Complete SQL portfolio project",
      description: "Build one query-heavy project to demonstrate your SQL skill.",
      profileSection: "skills",
    });

    await PracticeSession.create({
      userId: userIds[0],
      opportunityId: opportunity.id,
      questions: [
        { id: 1, text: "Tell me about yourself?" },
        { id: 2, text: "Why do you want this role?" },
      ],
      status: "GENERATED",
    });

    await UserLearning.create({
      userId: userIds[0],
      resourceId: resource.id,
      status: "IN_PROGRESS",
    });

    await Document.create({
      userId: userIds[0],
      documentType: "CV",
      fileName: "cv.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1200,
      storageKey: "uploads/cv.pdf",
    });

    const response = await request(app)
      .get("/api/v1/preparation/checklist")
      .query({ opportunityId: opportunity.id })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.opportunity.id).toBe(opportunity.id);
    expect(response.body.data.summary.totalItems).toBeGreaterThan(0);
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "READINESS" }),
        expect.objectContaining({ source: "PRACTICE" }),
        expect.objectContaining({ source: "LEARNING" }),
        expect.objectContaining({ source: "DOCUMENT" }),
      ]),
    );
    expect(response.body.data.items.some((item) => item.title.includes("CV"))).toBe(true);
    expect(response.body.data.overallState).toBe("IN_PROGRESS");
  });

  it("returns 404 when the opportunity is missing", async () => {
    const missingOpportunityId = randomUUID();

    const response = await request(app)
      .get("/api/v1/preparation/checklist")
      .query({ opportunityId: missingOpportunityId })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
