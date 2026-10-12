import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Profile,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetToken,
} from "../../src/database/models/index.js";

let testUserToken;

beforeAll(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  await EmailVerificationToken.destroy({
    where: {},
    truncate: true,
    cascade: true,
  });
  await PasswordResetToken.destroy({
    where: {},
    truncate: true,
    cascade: true,
  });
  await RefreshToken.destroy({ where: {}, truncate: true, cascade: true });
  await Profile.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});

// ==============================
// REGISTRATION
// ==============================
describe("POST /api/v1/auth/register", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "test@rovia.app",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("test@rovia.app");
    expect(res.body.data.user.firstName).toBe("Test");
    expect(res.body.data.user.lastName).toBe("User");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("should reject duplicate email", async () => {
    await request(app).post("/api/v1/auth/register").send({
      firstName: "First",
      lastName: "User",
      email: "dup@rovia.app",
      password: "SecurePass123!",
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Second",
      lastName: "User",
      email: "dup@rovia.app",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("should reject weak password (too short)", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "weak@rovia.app",
      password: "Short1!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject password without uppercase", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "noupper@rovia.app",
      password: "securepass123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject password without number", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "nonum@rovia.app",
      password: "SecurePass!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject password without special character", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "nospecial@rovia.app",
      password: "SecurePass123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject invalid email format", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Test",
      lastName: "User",
      email: "not-an-email",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject missing firstName", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      lastName: "User",
      email: "nofirst@rovia.app",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ==============================
// LOGIN
// ==============================
describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send({
      firstName: "Login",
      lastName: "Test",
      email: "login@rovia.app",
      password: "SecurePass123!",
    });
  });

  it("should login with valid credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "login@rovia.app",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.lastLoginAt).toBeDefined();
  });

  it("should reject wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "login@rovia.app",
      password: "WrongPassword123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject non-existent email with generic message", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "nobody@rovia.app",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });
});

// ==============================
// EMAIL VERIFICATION
// ==============================
describe("POST /api/v1/auth/verify-email", () => {
  it("should reject invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ token: "invalid-token" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("TOKEN_INVALID");
  });

  it("should reject missing token", async () => {
    const res = await request(app).post("/api/v1/auth/verify-email").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ==============================
// RESEND VERIFICATION
// ==============================
describe("POST /api/v1/auth/resend-verification", () => {
  it("should return 200 for existing unverified user", async () => {
    await request(app).post("/api/v1/auth/register").send({
      firstName: "Resend",
      lastName: "Test",
      email: "resend@rovia.app",
      password: "SecurePass123!",
    });

    const res = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "resend@rovia.app" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 200 for non-existent email (privacy)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "fake@rovia.app" });

    expect(res.status).toBe(200);
  });
});

// ==============================
// FORGOT PASSWORD
// ==============================
describe("POST /api/v1/auth/forgot-password", () => {
  it("should return 200 for existing user", async () => {
    await request(app).post("/api/v1/auth/register").send({
      firstName: "Forgot",
      lastName: "Test",
      email: "forgot@rovia.app",
      password: "SecurePass123!",
    });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "forgot@rovia.app" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 200 for non-existent email (privacy)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@rovia.app" });

    expect(res.status).toBe(200);
  });
});

// ==============================
// AUTH MIDDLEWARE
// ==============================
describe("Authentication Middleware", () => {
  it("should reject request without token", async () => {
    const res = await request(app).get("/api/v1/profile");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should reject request with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(401);
  });
});
