// tests/sharing.test.ts
import request from "supertest";
import app from "../app";

let tokenA: string;
let tokenB: string;
let docId: string;

beforeAll(async () => {
  // Login as Alice (user A)
  const resA = await request(app)
    .post("/auth/login")
    .send({ email: "alice@example.com" })
    .expect(200);
  tokenA = resA.body.data.token;

  // Login as Bob (user B)
  const resB = await request(app)
    .post("/auth/login")
    .send({ email: "bob@example.com" })
    .expect(200);
  tokenB = resB.body.data.token;
});

describe("Document sharing flow", () => {
  test("User A creates doc, User B cannot access it", async () => {
    // User A creates a document
    const createRes = await request(app)
      .post("/documents")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Test Doc" })
      .expect(200);
    docId = createRes.body.data.id;

    // User B attempts to GET the document → 403
    await request(app)
      .get(`/documents/${docId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(403);
  });

  test("Owner shares with User B, then User B can access", async () => {
    // Owner shares with Bob
    await request(app)
      .post(`/documents/${docId}/share`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ email: "bob@example.com" })
      .expect(200);

    // User B now can GET the document
    const getRes = await request(app)
      .get(`/documents/${docId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(200);
    expect(getRes.body.data.id).toBe(docId);
  });

  test("User B cannot share the document further", async () => {
    await request(app)
      .post(`/documents/${docId}/share`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ email: "carol@example.com" })
      .expect(403);
  });
});
