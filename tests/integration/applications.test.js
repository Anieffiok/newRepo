import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Application,
  ApplicationStage,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Application",
    lastName: "Test",
    email: `application-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

async function createOpportunity() {
  const response = await request(app)
    .post("/api/v1/opportunities")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title: `Test Opportunity ${randomUUID()}`,
      organisation: "Acme Org",
      type: "JOB",
      country: "Nigeria",
      location: "Lagos",
      deadline: "2027-12-31",
      applicationUrl: "https://example.com/apply",
      sourceUrl: "https://example.com/posting",
      description: "Sample opportunity for integration testing",
      trustLabel: "UNVERIFIED",
    });

  expect(response.status).toBe(201);
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
    await ApplicationStage.destroy({ where: { applicationId: (await Application.findAll({ where: { userId: userIds }, attributes: ["id"] })).map((app) => app.id) } });
    await Application.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Application endpoints", () => {
  it("requires authentication to list and create applications", async () => {
    const listResponse = await request(app).get("/api/v1/applications");
    const createResponse = await request(app)
      .post("/api/v1/applications")
      .send({ opportunityId: randomUUID() });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it("creates an application and returns a default APPLIED stage", async () => {
    const opportunity = await createOpportunity();

    const createResponse = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        opportunityId: opportunity.id,
        applicationDate: "2026-10-22",
        source: "FOUND_IN_ROVIA",
        notes: "Applied after reviewing listing",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.currentStage).toBe("APPLIED");
    expect(createResponse.body.data.status).toBe("ACTIVE");
    expect(createResponse.body.data.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stageType: "APPLIED", status: "COMPLETED" }),
      ]),
    );

    const listResponse = await request(app)
      .get("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it("updates an application and records a final outcome", async () => {
    const opportunity = await createOpportunity();
    const createResponse = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });
    const applicationId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .put(`/api/v1/applications/${applicationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ notes: "Updated notes", applicationUrl: "https://example.com/apply-now" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.notes).toBe("Updated notes");

    const outcomeResponse = await request(app)
      .post(`/api/v1/applications/${applicationId}/outcome`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ outcomeType: "REJECTED", outcomeDate: "2026-10-25" });

    expect(outcomeResponse.status).toBe(200);
    expect(outcomeResponse.body.data.outcomeType).toBe("REJECTED");
    expect(outcomeResponse.body.data.status).toBe("CLOSED");
    expect(outcomeResponse.body.data.currentStage).toBe("OUTCOME");
  });

  it("adds and updates application stages", async () => {
    const opportunity = await createOpportunity();
    const createResponse = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });
    const applicationId = createResponse.body.data.id;

    const addStageResponse = await request(app)
      .post(`/api/v1/applications/${applicationId}/stages`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        stageType: "INTERVIEW",
        status: "PLANNED",
        scheduledDate: "2026-11-05T10:00:00.000Z",
        assessmentArea: "Technical Interview",
      });

    expect(addStageResponse.status).toBe(200);
    expect(addStageResponse.body.data.currentStage).toBe("INTERVIEW");

    const stageId = addStageResponse.body.data.stages.find(
      (item) => item.stageType === "INTERVIEW",
    )?.id;

    const updateStageResponse = await request(app)
      .put(`/api/v1/applications/${applicationId}/stages/${stageId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "COMPLETED", notes: "Completed successfully" });

    expect(updateStageResponse.status).toBe(200);
    expect(updateStageResponse.body.data.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: stageId, status: "COMPLETED" }),
      ]),
    );
  });

  it("prevents cross-user access to an application", async () => {
    const opportunity = await createOpportunity();
    const createResponse = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });
    const applicationId = createResponse.body.data.id;
    const otherUser = await registerUser();

    const otherDetailResponse = await request(app)
      .get(`/api/v1/applications/${applicationId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);
    const otherUpdateResponse = await request(app)
      .put(`/api/v1/applications/${applicationId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ notes: "Should fail" });

    expect(otherDetailResponse.status).toBe(404);
    expect(otherUpdateResponse.status).toBe(404);
  });

  it("validates invalid IDs and payloads", async () => {
    const invalidCreateResponse = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: "not-a-uuid", source: "INVALID" });

    const invalidStageResponse = await request(app)
      .post(`/api/v1/applications/${randomUUID()}/stages`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ stageType: "NOT_A_STAGE" });

    expect(invalidCreateResponse.status).toBe(400);
    expect(invalidCreateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidStageResponse.status).toBe(400);
    expect(invalidStageResponse.body.error.code).toBe("VALIDATION_ERROR");
  });
});
