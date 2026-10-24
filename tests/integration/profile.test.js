import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Profile,
  Education,
  CareerGoal,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Profile",
    lastName: "Tester",
    email: `profile-${randomUUID()}@rovia.app`,
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

  await Profile.update(
    {
      headline: "Backend Engineer",
      location: "Lagos",
      country: "Nigeria",
      careerLevel: "MID_LEVEL",
      biography: "I build backend systems and APIs.",
    },
    { where: { userId: userIds[0] } },
  );
});

afterEach(async () => {
  if (userIds.length > 0) {
    await Education.destroy({ where: { userId: userIds } });
    await CareerGoal.destroy({ where: { userId: userIds } });
    await Profile.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Profile endpoints", () => {
  it("requires authentication to fetch or update the profile", async () => {
    const getResponse = await request(app).get("/api/v1/profile");
    const updateResponse = await request(app)
      .put("/api/v1/profile")
      .send({ headline: "Updated headline" });

    expect(getResponse.status).toBe(401);
    expect(updateResponse.status).toBe(401);
  });

  it("returns the aggregate profile and completion details for the authenticated user", async () => {
    await Education.create({
      userId: userIds[0],
      institution: "University of Lagos",
      qualification: "BSc",
      fieldOfStudy: "Computer Science",
      degree: "BSc",
      startDate: "2018-09-01",
      endDate: "2022-08-31",
    });

    await CareerGoal.create({
      userId: userIds[0],
      goalType: "Short-term",
      targetRole: "Senior Backend Engineer",
      targetIndustry: "Fintech",
      targetLocation: "Remote",
      priority: "HIGH",
      status: "ACTIVE",
    });

    const response = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.profile).toMatchObject({
      userId: userIds[0],
      headline: "Backend Engineer",
      location: "Lagos",
      country: "Nigeria",
      careerLevel: "MID_LEVEL",
    });
    expect(response.body.data.education[0].institution).toBe(
      "University of Lagos",
    );
    expect(response.body.data.careerGoals[0].targetRole).toBe(
      "Senior Backend Engineer",
    );
    expect(response.body.data.completion).toMatchObject({
      status: "COMPLETE",
      percentage: 100,
    });
  });

  it("updates core profile fields and rejects invalid values", async () => {
    const validUpdateResponse = await request(app)
      .put("/api/v1/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        headline: "Senior Backend Engineer",
        location: "Abuja",
        country: "Nigeria",
        careerLevel: "SENIOR",
        biography: "Building resilient APIs and platform services.",
      });

    expect(validUpdateResponse.status).toBe(200);
    expect(validUpdateResponse.body.success).toBe(true);
    expect(validUpdateResponse.body.data.profile).toMatchObject({
      headline: "Senior Backend Engineer",
      location: "Abuja",
      country: "Nigeria",
      careerLevel: "SENIOR",
      biography: "Building resilient APIs and platform services.",
    });

    const invalidCareerLevelResponse = await request(app)
      .put("/api/v1/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ careerLevel: "INVALID_LEVEL" });

    expect(invalidCareerLevelResponse.status).toBe(400);
    expect(invalidCareerLevelResponse.body.error.code).toBe("VALIDATION_ERROR");

    const longHeadlineResponse = await request(app)
      .put("/api/v1/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ headline: "A".repeat(256) });

    expect(longHeadlineResponse.status).toBe(400);
    expect(longHeadlineResponse.body.error.code).toBe("VALIDATION_ERROR");
  });
});
