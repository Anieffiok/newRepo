import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  Certification,
  sequelize,
  User,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Certification",
    lastName: "Test",
    email: `certification-${randomUUID()}@rovia.app`,
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
    await Certification.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Certification endpoints", () => {
  it("requires authentication to list and create certifications", async () => {
    const listResponse = await request(app).get(
      "/api/v1/profile/certifications",
    );
    const createResponse = await request(app)
      .post("/api/v1/profile/certifications")
      .send({ name: "AWS Solutions Architect", issuer: "Amazon Web Services" });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it("creates a certification and lists it for its owner", async () => {
    const certification = {
      name: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      issueDate: "2024-01-15",
      expiryDate: "2027-01-15",
      credentialId: "AWS-SAA-TEST",
      credentialUrl: "https://example.com/verify",
    };

    const createResponse = await request(app)
      .post("/api/v1/profile/certifications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(certification);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toMatchObject({
      ...certification,
      verificationStatus: "PENDING",
    });
    expect(createResponse.body.data.id).toBeDefined();

    const listResponse = await request(app)
      .get("/api/v1/profile/certifications")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(createResponse.body.data.id);
  });

  it("updates a certification and rejects an expiry date before its issue date", async () => {
    const createResponse = await request(app)
      .post("/api/v1/profile/certifications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Project Management Professional",
        issuer: "PMI",
        issueDate: "2024-03-01",
        expiryDate: "2027-03-01",
      });
    const certificationId = createResponse.body.data.id;

    expect(createResponse.status).toBe(201);

    const updateResponse = await request(app)
      .put(`/api/v1/profile/certifications/${certificationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated PMP", credentialId: "PMP-UPDATED" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe("Updated PMP");
    expect(updateResponse.body.data.credentialId).toBe("PMP-UPDATED");

    const invalidDateResponse = await request(app)
      .put(`/api/v1/profile/certifications/${certificationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ expiryDate: "2023-01-01" });

    expect(invalidDateResponse.status).toBe(400);
    expect(invalidDateResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("does not allow another user to view, update, or delete a certification", async () => {
    const ownerId = userIds[0];
    const ownerToken = accessToken;
    const otherUser = await registerUser();
    const createResponse = await request(app)
      .post("/api/v1/profile/certifications")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Security Certification", issuer: "Test Issuer" });
    const certificationId = createResponse.body.data.id;

    expect(createResponse.status).toBe(201);
    expect(userIds).toContain(ownerId);

    const updateResponse = await request(app)
      .put(`/api/v1/profile/certifications/${certificationId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`)
      .send({ name: "Unauthorized update" });
    const deleteResponse = await request(app)
      .delete(`/api/v1/profile/certifications/${certificationId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);
    const listResponse = await request(app)
      .get("/api/v1/profile/certifications")
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(0);
  });

  it("validates required fields, dates, URLs, and certification IDs", async () => {
    const invalidCreateResponse = await request(app)
      .post("/api/v1/profile/certifications")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: " ",
        issuer: "",
        issueDate: "not-a-date",
        credentialUrl: "not-a-url",
      });
    const invalidId = randomUUID().replaceAll("-", "");
    const invalidUpdateResponse = await request(app)
      .put(`/api/v1/profile/certifications/${invalidId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated" });

    expect(invalidCreateResponse.status).toBe(400);
    expect(invalidCreateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidUpdateResponse.status).toBe(400);
    expect(invalidUpdateResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns not found when updating or deleting an unknown certification", async () => {
    const unknownId = randomUUID();

    const updateResponse = await request(app)
      .put(`/api/v1/profile/certifications/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Missing" });
    const deleteResponse = await request(app)
      .delete(`/api/v1/profile/certifications/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
