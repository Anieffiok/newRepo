import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Action,
  Opportunity,
  Application,
  Profile,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Home",
    lastName: "Test",
    email: `home-${randomUUID()}@rovia.app`,
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
      title: `Home opportunity ${randomUUID()}`,
      organisation: "Rovia Labs",
      type: "JOB",
      country: "Nigeria",
      location: "Lagos",
      deadline: "2027-12-31",
      applicationUrl: "https://example.com/opportunity",
      sourceUrl: "https://example.com/posting",
      description: "Opportunity for home test coverage",
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
    await Action.destroy({ where: { userId: userIds } });
    await Application.destroy({ where: { userId: userIds } });
    await Opportunity.destroy({ where: { addedByUserId: userIds } });
    await Profile.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Home endpoints", () => {
  it("requires authentication for dashboard and actions", async () => {
    const dashboardResponse = await request(app).get("/api/v1/home");
    const listActionsResponse = await request(app).get("/api/v1/actions");

    expect(dashboardResponse.status).toBe(401);
    expect(listActionsResponse.status).toBe(401);
  });

  it("returns the dashboard with actions, deadlines, and recommendations", async () => {
    const opportunity = await createOpportunity();
    const applicationResponse = await request(app)
      .post("/api/v1/applications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    expect(applicationResponse.status).toBe(201);

    const dashboardResponse = await request(app)
      .get("/api/v1/home")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.success).toBe(true);
    expect(dashboardResponse.body.data).toHaveProperty("nextActions");
    expect(dashboardResponse.body.data).toHaveProperty("upcomingDeadlines");
    expect(dashboardResponse.body.data).toHaveProperty("recommendedOpportunities");
    expect(dashboardResponse.body.data).toHaveProperty("greeting");
  });

  it("lists actions filtered by status and priority", async () => {
    await Action.create({
      userId: userIds[0],
      title: "Review application",
      reason: "Check next steps",
      priority: "HIGH",
      status: "OPEN",
      dueDate: new Date(),
      sourceType: "APPLICATION",
      sourceId: null,
    });

    const openResponse = await request(app)
      .get("/api/v1/actions")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ status: "OPEN", priority: "HIGH" });

    expect(openResponse.status).toBe(200);
    expect(openResponse.body.success).toBe(true);
    expect(openResponse.body.data.today.length + openResponse.body.data.thisWeek.length + openResponse.body.data.later.length).toBeGreaterThan(0);

    const allResponse = await request(app)
      .get("/api/v1/actions")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ status: "ALL" });

    expect(allResponse.status).toBe(200);
    expect(allResponse.body.data).toHaveProperty("today");
  });

  it("updates an action status and rejects invalid IDs/statuses", async () => {
    const action = await Action.create({
      userId: userIds[0],
      title: "Follow up on application",
      reason: "Action for test",
      priority: "MEDIUM",
      status: "OPEN",
      dueDate: new Date(),
      sourceType: "APPLICATION",
      sourceId: null,
    });

    const updateResponse = await request(app)
      .put(`/api/v1/actions/${action.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "DONE" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.status).toBe("DONE");

    const invalidStatusResponse = await request(app)
      .put(`/api/v1/actions/${action.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "INVALID" });

    const invalidIdResponse = await request(app)
      .put(`/api/v1/actions/${randomUUID().replace(/-/g, "")}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "DONE" });

    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for a missing action ID", async () => {
    const unknownId = randomUUID();
    const response = await request(app)
      .put(`/api/v1/actions/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "DONE" });

    expect(response.status).toBe(404);
  });
});
