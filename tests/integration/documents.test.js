import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import {
  sequelize,
  User,
  Document,
} from "../../src/database/models/index.js";

let accessToken;
let userIds = [];

async function registerUser() {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Document",
    lastName: "Test",
    email: `documents-${randomUUID()}@rovia.app`,
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
    await Document.destroy({ where: { userId: userIds } });
    await User.destroy({ where: { id: userIds } });
  }

  accessToken = undefined;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Document endpoints", () => {
  it("requires authentication to read or upload documents", async () => {
    const listResponse = await request(app).get("/api/v1/documents");
    const uploadResponse = await request(app)
      .post("/api/v1/documents")
      .attach("file", Buffer.from("fake pdf content"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(listResponse.status).toBe(401);
    expect(uploadResponse.status).toBe(401);
  });

  it("uploads a document and returns it in the user's list", async () => {
    const uploadResponse = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("%PDF-1.4\n..."), {
        filename: "cv.pdf",
        contentType: "application/pdf",
      })
      .field("documentType", "CV");

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.success).toBe(true);
    expect(uploadResponse.body.data.fileName).toBe("cv.pdf");
    expect(uploadResponse.body.data.documentType).toBe("CV");

    const listResponse = await request(app)
      .get("/api/v1/documents")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].fileName).toBe("cv.pdf");
  });

  it("creates a download URL and deletes the uploaded document", async () => {
    const uploadResponse = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("%PDF-1.4\n..."), {
        filename: "transcript.pdf",
        contentType: "application/pdf",
      })
      .field("documentType", "TRANSCRIPT");

    const documentId = uploadResponse.body.data.id;

    const downloadResponse = await request(app)
      .get(`/api/v1/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.body.success).toBe(true);
    expect(downloadResponse.body.data.downloadUrl).toContain(
      "mock-storage.rovia.app",
    );

    const deleteResponse = await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe("Document deleted successfully");

    const listResponse = await request(app)
      .get("/api/v1/documents")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listResponse.body.data).toHaveLength(0);
  });

  it("rejects invalid file types and malformed document IDs", async () => {
    const invalidTypeResponse = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("not a real file"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    const invalidIdResponse = await request(app)
      .get("/api/v1/documents/not-a-uuid/download")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(invalidTypeResponse.status).toBe(400);
    expect(invalidTypeResponse.body.error.code).toBe("INVALID_FILE_TYPE");
    expect(invalidIdResponse.status).toBe(400);
    expect(invalidIdResponse.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("prevents another user from downloading or deleting a document", async () => {
    const uploadResponse = await request(app)
      .post("/api/v1/documents")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("%PDF-1.4\n..."), {
        filename: "owner-cv.pdf",
        contentType: "application/pdf",
      });

    const documentId = uploadResponse.body.data.id;
    const otherUser = await registerUser();

    const downloadResponse = await request(app)
      .get(`/api/v1/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    const deleteResponse = await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(downloadResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);

    const otherListResponse = await request(app)
      .get("/api/v1/documents")
      .set("Authorization", `Bearer ${otherUser.accessToken}`);

    expect(otherListResponse.status).toBe(200);
    expect(otherListResponse.body.data).toHaveLength(0);
  });

  it("returns 404 for an unknown document id", async () => {
    const unknownId = randomUUID();

    const downloadResponse = await request(app)
      .get(`/api/v1/documents/${unknownId}/download`)
      .set("Authorization", `Bearer ${accessToken}`);
    const deleteResponse = await request(app)
      .delete(`/api/v1/documents/${unknownId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(downloadResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
