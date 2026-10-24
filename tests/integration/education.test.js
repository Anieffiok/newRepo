import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Education,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Education",
    lastName: "Test",
    email: `education-${randomUUID()}@rovia.app`,
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
    await Education.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Education endpoints", () => {
  it("requires authentication to list and create education records", async () => {
    const listResponse = await request(app).get("/api/v1/profile/education");
    const createResponse = await request(app)
      .post("/api/v1/profile/education")
      .send({
        institution: "University of Lagos",
        qualification: "B.Sc",
        fieldOfStudy: "Computer Science",
      });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it("creates and lists education records for the authenticated user", async () => {
    const payload = {
      institution: "University of Lagos",
      qualification: "B.Sc Computer Science",
      fieldOfStudy: "Computer Science",
      startDate: "2018-09-01",
      endDate: "2022-06-30",
      country: "Nigeria",
    };

    const createResponse = await request(app)
      .post("/api/v1/profile/education")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toMatchObject({
      ...payload,
      verificationStatus: "PENDING",
    });

    const listResponse = await request(app)
      .get("/api/v1/profile/education")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].institution).toBe(payload.institution);
  });

  it("updates an education record and rejects end dates before start dates", async () => {
    const createResponse = await request(app)
      .post("/api/v1/profile/education")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        institution: "University of Ibadan",
        qualification: "M.Sc",
        fieldOfStudy: "Data Science",
        startDate: "2020-09-01",
        endDate: "2022-09-30",
      });

    const educationId = createResponse.body.data.id;

    const updateResponse = await request(app)
      .put(`/api/v1/profile/education/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ qualification: "M.Sc Data Science", country: "Nigeria" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.qualification).toBe("M.Sc Data Science");

    const invalidDateResponse = await request(app)
      .put(`/api/v1/profile/education/${educationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ startDate: "2025-01-01", endDate: "2024-01-01" });

    expect(invalidDateResponse.status).toBe(400);
    expect(invalidDateResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("prevents another user from updating or deleting education records", async () => {
    const createResponse = await request(app)
      .post("/api/v1/profile/education")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        institution: "University of Abuja",
        qualification: "B.Eng",
        fieldOfStudy: "Electrical Engineering",
      });

    const educationId = createResponse.body.data.id;
    const otherUser = await registerUser();

    const updateResponse = await request(app)
      .put(`/api/v1/profile/education/${educationId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ qualification: "Unauthorized update" });

    const deleteResponse = await request(app)
      .delete(`/api/v1/profile/education/${educationId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    const otherListResponse = await request(app)
      .get("/api/v1/profile/education")
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(otherListResponse.status).toBe(200);
    expect(otherListResponse.body.data).toHaveLength(0);
  });

  it("validates required fields and invalid education IDs", async () => {
    const invalidCreateResponse = await request(app)
      .post("/api/v1/profile/education")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        institution: "   ",
        qualification: "",
        fieldOfStudy: "   ",
        startDate: "not-a-date",
      });

    const invalidIdResponse = await request(app)
      .put(`/api/v1/profile/education/${randomUUID().replace(/-/g, "")}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ institution: "Updated Institution" });

    expect(invalidCreateResponse.status).toBe(400);
    expect(invalidCreateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for unknown education records", async () => {
    const unknownId = randomUUID();

    const updateResponse = await request(app)
      .put(`/api/v1/profile/education/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ institution: "Missing Institution" });

    const deleteResponse = await request(app)
      .delete(`/api/v1/profile/education/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
