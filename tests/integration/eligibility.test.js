import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Opportunity,
  OpportunityRequirement,
  EligibilityResult,
  EligibilityItem,
  Profile,
  Education,
  Experience,
  UserSkill,
  Skill,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];
let opportunityIds = [];
let requirementIds = [];
let eligibilityIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Eligibility",
    lastName: "Tester",
    email: `eligibility-${randomUUID()}@rovia.app`,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  userIds.push(response.body.data.user.id);
  return response.body.data;
}

async function createOpportunityWithRequirements() {
  const opportunity = await Opportunity.create({
    title: "Frontend Engineer",
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
    description: "Bachelor's degree in Computer Science or related field",
    isRequired: true,
    evidenceSource: "PUBLISHED",
    acceptsAnyDiscipline: true,
  });

  const skillRequirement = await OpportunityRequirement.create({
    opportunityId: opportunity.id,
    type: "SKILLS",
    description: "Strong JavaScript and React experience",
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
  eligibilityIds = [];

  const user = await registerUser();
  accessToken = user.accessToken;

  await Profile.update(
    { country: "Nigeria", careerLevel: "MID_LEVEL" },
    { where: { userId: userIds[0] } },
  );

  await Education.create({
    userId: userIds[0],
    institution: "University of Ibadan",
    qualification: "BSc",
    fieldOfStudy: "Computer Science",
    degree: "BSc",
    startDate: "2019-09-01",
    endDate: "2023-06-30",
  });

  const skill = await Skill.create({
    name: "JavaScript",
    category: "WEB",
  });

  await UserSkill.create({
    userId: userIds[0],
    skillId: skill.id,
    proficiency: "ADVANCED",
    evidence: "Portfolio",
  });
});

afterEach(async () => {
  if (eligibilityIds.length > 0) {
    await EligibilityItem.destroy({ where: { eligibilityResultId: eligibilityIds } });
    await EligibilityResult.destroy({ where: { id: eligibilityIds } });
  }

  if (requirementIds.length > 0) {
    await OpportunityRequirement.destroy({ where: { id: requirementIds } });
  }

  if (opportunityIds.length > 0) {
    await Opportunity.destroy({ where: { id: opportunityIds } });
  }

  if (userIds.length > 0) {
    await UserSkill.destroy({ where: { userId: userIds } });
    await Skill.destroy({ where: { name: "JavaScript" } });
    await Experience.destroy({ where: { userId: userIds } });
    await Education.destroy({ where: { userId: userIds } });
    await Profile.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Eligibility endpoints", () => {
  it("requires authentication and validates the opportunity payload", async () => {
    const unauthenticatedResponse = await request(app)
      .post("/api/v1/eligibility/analyse")
      .send({ opportunityId: randomUUID() });

    const invalidPayloadResponse = await request(app)
      .post("/api/v1/eligibility/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: "not-a-uuid" });

    expect(unauthenticatedResponse.status).toBe(401);
    expect(invalidPayloadResponse.status).toBe(400);
    expect(invalidPayloadResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("analyses eligibility and returns a match result with requirement items", async () => {
    const opportunity = await createOpportunityWithRequirements();

    const response = await request(app)
      .post("/api/v1/eligibility/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.opportunity.id).toBe(opportunity.id);
    expect(response.body.data.matchLabel).toEqual(
      expect.stringMatching(/STRONG_MATCH|GOOD_MATCH|NEEDS_PREPARATION/),
    );
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(response.body.data.items[0]).toHaveProperty("result");
    eligibilityIds.push(response.body.data.id);
  });

  it("returns a saved eligibility result by ID for the authenticated user", async () => {
    const opportunity = await createOpportunityWithRequirements();

    const createResponse = await request(app)
      .post("/api/v1/eligibility/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: opportunity.id });

    const resultId = createResponse.body.data.id;
    eligibilityIds.push(resultId);

    const getResponse = await request(app)
      .get(`/api/v1/eligibility/${resultId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.id).toBe(resultId);
    expect(getResponse.body.data.opportunity.id).toBe(opportunity.id);
    expect(getResponse.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ result: expect.any(String) }),
      ]),
    );
  });

  it("rejects opportunities without requirements and returns 404 for unknown results", async () => {
    const emptyOpportunity = await Opportunity.create({
      title: "Volunteer Role",
      organisation: "Community Org",
      type: "VOLUNTEERING",
      country: "Nigeria",
      location: "Remote",
      deadline: "2030-12-31",
    });
    opportunityIds.push(emptyOpportunity.id);

    const emptyResponse = await request(app)
      .post("/api/v1/eligibility/analyse")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ opportunityId: emptyOpportunity.id });

    expect(emptyResponse.status).toBe(400);
    expect(emptyResponse.body.error.code).toBe("VALIDATION_ERROR");

    const missingResultResponse = await request(app)
      .get(`/api/v1/eligibility/${randomUUID()}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(missingResultResponse.status).toBe(404);
    expect(missingResultResponse.body.error.code).toBe("NOT_FOUND");
  });
});
