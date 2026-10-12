import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Profile,
  RefreshToken,
  EmailVerificationToken,
} from "../../src/database/models/index.js";

let accessToken;

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  await EmailVerificationToken.destroy({
    where: {},
    truncate: true,
    cascade: true,
  });
  await RefreshToken.destroy({ where: {}, truncate: true, cascade: true });
  await Profile.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });

  const res = await request(app).post("/api/v1/auth/register").send({
    firstName: "Stage1",
    lastName: "Test",
    email: "stage1@rovia.app",
    password: "SecurePass123!",
  });

  accessToken = res.body.data.accessToken;
});

afterAll(async () => {
  await sequelize.close();
});

// ==============================
// PUT /users/me
// ==============================
describe("PUT /api/v1/users/me", () => {
  it("should update firstName", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ firstName: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.firstName).toBe("Updated");
  });

  it("should update lastName", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lastName: "NewLast" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.lastName).toBe("NewLast");
  });

  it("should reject without auth", async () => {
    const res = await request(app)
      .put("/api/v1/users/me")
      .send({ firstName: "Hack" });

    expect(res.status).toBe(401);
  });
});

// ==============================
// GET /users/export
// ==============================
describe("GET /api/v1/users/export", () => {
  it("should return full data export", async () => {
    const res = await request(app)
      .get("/api/v1/users/export")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exportedAt).toBeDefined();
    expect(res.body.data.account).toBeDefined();
    expect(res.body.data.account.email).toBe("stage1@rovia.app");
  });

  it("should reject without auth", async () => {
    const res = await request(app).get("/api/v1/users/export");

    expect(res.status).toBe(401);
  });
});

// ==============================
// DELETE /users/me
// ==============================
describe("DELETE /api/v1/users/me", () => {
  it("should deactivate account with correct password", async () => {
    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "SecurePass123!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify account is deactivated
    const user = await User.findOne({ where: { email: "stage1@rovia.app" } });
    expect(user.accountStatus).toBe("DEACTIVATED");
  });

  it("should reject wrong password", async () => {
    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "WrongPass123!" });

    expect(res.status).toBe(401);
  });

  it("should reject missing password", async () => {
    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
