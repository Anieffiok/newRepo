import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  Skill,
  User,
  UserSkill,
} from "../../src/database/models/index.js";

let accessToken;
let userId;
let skillNames = [];

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  skillNames = [];

  const email = `skills-${randomUUID()}@rovia.app`;
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Skills",
    lastName: "Test",
    email,
    password: "SecurePass123!",
  });

  expect(response.status).toBe(201);
  accessToken = response.body.data.accessToken;
  userId = response.body.data.user.id;
});

afterEach(async () => {
  if (userId) {
    await UserSkill.destroy({ where: { userId } });
    await User.destroy({ where: { id: userId } });
  }

  if (skillNames?.length > 0) {
    await Skill.destroy({ where: { name: skillNames } });
  }

  accessToken = undefined;
  userId = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("GET /api/v1/skills", () => {
  it("returns catalog skills matching the search query", async () => {
    const name = `Skills catalog ${randomUUID()}`;
    skillNames.push(name);
    await Skill.create({ name, category: "Testing" });

    const response = await request(app)
      .get("/api/v1/skills")
      .query({ query: name });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.map((skill) => skill.name)).toContain(name);
  });
});

describe("User skills", () => {
  it("requires authentication to read or add user skills", async () => {
    const readResponse = await request(app).get("/api/v1/skills/my-skills");
    const addResponse = await request(app)
      .post("/api/v1/skills/my-skills")
      .send({ name: "Unauthorized skill" });

    expect(readResponse.status).toBe(401);
    expect(addResponse.status).toBe(401);
  });

  it("adds a skill and returns it in the user's skill list", async () => {
    const name = `Skills add ${randomUUID()}`;
    skillNames.push(name);

    const addResponse = await request(app)
      .post("/api/v1/skills/my-skills")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: ` ${name} `,
        category: "Testing",
        proficiency: "ADVANCED",
        evidence: "Built integration tests",
      });

    expect(addResponse.status).toBe(201);
    expect(addResponse.body.success).toBe(true);
    expect(addResponse.body.data.name).toBe(name);
    expect(addResponse.body.data.UserSkill.proficiency).toBe("ADVANCED");
    expect(addResponse.body.data.UserSkill.evidence).toBe(
      "Built integration tests",
    );

    const listResponse = await request(app)
      .get("/api/v1/skills/my-skills")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].name).toBe(name);
    expect(listResponse.body.data[0].UserSkill.proficiency).toBe("ADVANCED");
  });

  it("rejects adding the same skill to a profile twice", async () => {
    const name = `Skills duplicate ${randomUUID()}`;
    skillNames.push(name);
    const addSkill = () =>
      request(app)
        .post("/api/v1/skills/my-skills")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name });

    expect((await addSkill()).status).toBe(201);

    const duplicateResponse = await addSkill();

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe("CONFLICT");
  });

  it("updates and removes a skill from the user's profile", async () => {
    const name = `Skills update ${randomUUID()}`;
    skillNames.push(name);
    const addResponse = await request(app)
      .post("/api/v1/skills/my-skills")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name });
    const skillId = addResponse.body.data.id;

    expect(addResponse.status).toBe(201);

    const updateResponse = await request(app)
      .put(`/api/v1/skills/my-skills/${skillId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ proficiency: "EXPERT", evidence: "Verified expertise" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.UserSkill.proficiency).toBe("EXPERT");
    expect(updateResponse.body.data.UserSkill.evidence).toBe(
      "Verified expertise",
    );

    const removeResponse = await request(app)
      .delete(`/api/v1/skills/my-skills/${skillId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(removeResponse.status).toBe(200);
    expect(removeResponse.body.data).toBeNull();

    const listResponse = await request(app)
      .get("/api/v1/skills/my-skills")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.body.data).toHaveLength(0);
  });

  it("validates skill data and skill IDs", async () => {
    const invalidSkillResponse = await request(app)
      .post("/api/v1/skills/my-skills")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "   ", proficiency: "MASTER" });

    const invalidIdResponse = await request(app)
      .delete("/api/v1/skills/my-skills/not-a-uuid")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(invalidSkillResponse.status).toBe(400);
    expect(invalidSkillResponse.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });
});
