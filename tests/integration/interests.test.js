import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Interest,
  UserInterest,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Interest",
    lastName: "Test",
    email: `interest-${randomUUID()}@rovia.app`,
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
    await UserInterest.destroy({ where: { userId: userIds } });
    await Interest.destroy({ where: { name: ["Cloud Architecture", "Distributed Systems", "Machine Learning", "Cybersecurity", "AI Ethics"] } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Interest endpoints", () => {
  it("returns master interests and supports search", async () => {
    await Interest.create({ name: "Cloud Architecture", category: "Technology" });
    await Interest.create({ name: "Distributed Systems", category: "Technology" });

    const searchResponse = await request(app)
      .get("/api/v1/interests")
      .query({ query: "cloud" });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.success).toBe(true);
    expect(searchResponse.body.data.map((item) => item.name)).toContain(
      "Cloud Architecture",
    );
  });

  it("requires authentication to read or add interests for a user", async () => {
    const listResponse = await request(app).get("/api/v1/interests/my-interests");
    const addResponse = await request(app)
      .post("/api/v1/interests/my-interests")
      .send({ name: "Cybersecurity" });

    expect(listResponse.status).toBe(401);
    expect(addResponse.status).toBe(401);
  });

  it("adds and lists user interests", async () => {
    const addResponse = await request(app)
      .post("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Machine Learning", category: "AI" });

    expect(addResponse.status).toBe(201);
    expect(addResponse.body.success).toBe(true);
    expect(addResponse.body.data.name).toBe("Machine Learning");

    const listResponse = await request(app)
      .get("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].name).toBe("Machine Learning");
  });

  it("bulk sync replaces the user interest list", async () => {
    const syncResponse = await request(app)
      .put("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interests: ["AI Ethics", "Cloud Architecture"] });

    expect(syncResponse.status).toBe(200);
    expect(syncResponse.body.success).toBe(true);
    expect(syncResponse.body.data).toHaveLength(2);

    const listResponse = await request(app)
      .get("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.map((item) => item.name)).toEqual(
      expect.arrayContaining(["AI Ethics", "Cloud Architecture"]),
    );
  });

  it("removes an interest from the user's profile", async () => {
    const addResponse = await request(app)
      .post("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Cybersecurity" });

    const interestId = addResponse.body.data.id;

    const removeResponse = await request(app)
      .delete(`/api/v1/interests/my-interests/${interestId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body.success).toBe(true);

    const listResponse = await request(app)
      .get("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.body.data).toHaveLength(0);
  });

  it("validates invalid inputs and IDs", async () => {
    const invalidCreateResponse = await request(app)
      .post("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "   " });

    const invalidSyncResponse = await request(app)
      .put("/api/v1/interests/my-interests")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interests: ["Valid", "   "] });

    const invalidIdResponse = await request(app)
      .delete(`/api/v1/interests/my-interests/${randomUUID().replace(/-/g, "")}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(invalidCreateResponse.status).toBe(400);
    expect(invalidCreateResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidSyncResponse.status).toBe(400);
    expect(invalidSyncResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });
});
