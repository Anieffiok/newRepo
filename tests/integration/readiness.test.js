import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Opportunity,
  OpportunityRequirement,
  Profile,
  Education,
  UserSkill,
  Skill,
  ReadinessResult,
  ReadinessItem,
  EligibilityResult,
  EligibilityItem,
  Document,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];
let opportunityIds = [];
let requirementIds = [];
let readinessIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Readiness",
    lastName: "Tester",
    email: `readiness-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

async function createOpportunityWithRequirements() {
  const opportunity = await Opportunity.create({
    title: "Product Analyst",
    organisation: "Rovia Labs",
    type: "JOB",
    country: "Nigeria",
    location: "Lagos",
    deadline: "2030-12-31",
  });

  opportunityIds.push(opportunity.id);

  const degreeRequirement = await OpportunityRequirement.create({
    opportunityId: opportunity.id,
    type: "DEGREE",
    description: "Bachelor's degree in a relevant field",
    isRequired: true,
    evidenceSource: "PUBLISHED",
    acceptsAnyDiscipline: true,
  });

  const skillRequirement = await OpportunityRequirement.create({
    opportunityId: opportunity.id,
    type: "SKILLS",
    description: "Experience with SQL and analytics tooling",
    isRequired: true,
    evidenceSource: "PUBLISHED",
    acceptsAnyDiscipline: false,
  });

  requirementIds.push(degreeRequirement.id, skillRequirement.id);
  return opportunity;
}

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  userIds = [];
  opportunityIds = [];
  requirementIds = [];
  readinessIds = [];

  const user = await registerUser();
  accessToken = user.accessToken;

  await Profile.update(
    { country: "Nigeria", careerLevel: "MID_LEVEL" },
    { where: { userId: userIds[0] } },
  );

  await Education.create({
    userId: userIds[0],
    institution: "University of Lagos",
    qualification: "BSc",
    fieldOfStudy: "Economics",
    degree: "BSc",
    startDate: "2019-09-01",
    endDate: "2023-08-31",
  });

  const skill = await Skill.create({
    name: "SQL",
    category: "DATA",
  });

  await UserSkill.create({
    userId: userIds[0],
    skillId: skill.id,
    proficiency: "INTERMEDIATE",
    evidence: "Portfolio project",
  });
});

afterEach(async () => {
  if (readinessIds.length > 0) {
    await ReadinessItem.destroy({ where: { readinessResultId: readinessIds } });
    await ReadinessResult.destroy({ where: { id: readinessIds } });
  }

  if (opportunityIds.length > 0) {
    await EligibilityItem.destroy({
      where: { eligibilityResultId: await EligibilityResult.findAll({ where: { opportunityId: opportunityIds } }).then((rows) => rows.map((row) => row.id)) },
    });
    await EligibilityResult.destroy({ where: { opportunityId: opportunityIds } });
    await OpportunityRequirement.destroy({ where: { opportunityId: opportunityIds } });
    await Opportunity.destroy({ where: { id: opportunityIds } });
  }

  if (userIds.length > 0) {
    await Document.destroy({ where: { userId: userIds } });
    await UserSkill.destroy({ where: { userId: userIds } });
    await Skill.destroy({ where: { name: "SQL" } });
    await Education.destroy({ where: { userId: userIds } });
    await Profile.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Readiness endpoints", () => {
  it("requires authentication and validates the opportunityId payload", async () => {
    const unauthenticatedResponse = await request(app)
      .post("/api/v1/readiness/analyse")
      .send({ opportunityId: randomUUID() });

    const invalidPayloadResponse = await request(app)
      .post("/api/v1/readiness/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: "bad-id" });

    expect(unauthenticatedResponse.status).toBe(401);
    expect(invalidPayloadResponse.status).toBe(400);
    expect(invalidPayloadResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("analyses readiness for an opportunity and returns action items", async () => {
    const opportunity = await createOpportunityWithRequirements();

    const response = await request(app)
      .post("/api/v1/readiness/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.opportunity.id).toBe(opportunity.id);
    expect(response.body.data.state).toEqual(
      expect.stringMatching(/READY|NEEDS_PREPARATION|MISSING_REQUIREMENT|INFORMATION_NEEDED/),
    );
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
    readinessIds.push(response.body.data.id);
  });

  it("reads and updates an existing readiness result item", async () => {
    const opportunity = await createOpportunityWithRequirements();

    const createResponse = await request(app)
      .post("/api/v1/readiness/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    const readinessId = createResponse.body.data.id;
    readinessIds.push(readinessId);

    const itemId = createResponse.body.data.items[0].id;

    const getResponse = await request(app)
      .get(`/api/v1/readiness/${readinessId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.id).toBe(readinessId);

    const updateResponse = await request(app)
      .put(`/api/v1/readiness/${readinessId}/items/${itemId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "DONE" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.items.some((item) => item.id === itemId)).toBe(true);
  });

  it("validates item status and unknown result/item IDs", async () => {
    const opportunity = await createOpportunityWithRequirements();

    const createResponse = await request(app)
      .post("/api/v1/readiness/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    const readinessId = createResponse.body.data.id;
    readinessIds.push(readinessId);

    const invalidStatusResponse = await request(app)
      .put(`/api/v1/readiness/${readinessId}/items/${createResponse.body.data.items[0].id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "COMPLETED" });

    const invalidReadinessIdResponse = await request(app)
      .put(`/api/v1/readiness/${randomUUID()}/items/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "DONE" });

    expect(invalidStatusResponse.status).toBe(400);
    expect(invalidStatusResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidReadinessIdResponse.status).toBe(400);
    expect(invalidReadinessIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when the readiness result is missing", async () => {
    const response = await request(app)
      .get(`/api/v1/readiness/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
