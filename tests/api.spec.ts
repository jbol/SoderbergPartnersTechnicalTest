import { test, expect } from "@playwright/test";

const BASE = "https://reqres.in";
const API_KEY = "reqres-free-v1";
const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

test.describe("Authentication scenarios", () => {
  test("POST /api/login - successful login with valid credentials", async ({ request }) => {
    const res = await request.post(`${BASE}/api/login`, {
      headers,
      data: {
        email: "eve.holt@reqres.in",
        password: "cityslicka",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
  });

  test("POST /api/login - invalid credentials should not return token", async ({ request }) => {
    const res = await request.post(`${BASE}/api/login`, {
      headers,
      data: {
        email: "eve.holt@reqres.in",
        password: "wrong-password",
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/login - missing password yields an error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/login`, {
      headers,
      data: { email: "eve.holt@reqres.in" },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).toHaveProperty("error");
  });

  test("POST /api/login - missing email yields an error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/login`, {
      headers,
      data: { password: "cityslicka" },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).toHaveProperty("error");
  });
});

test.describe("User details endpoint", () => {
  test("GET /api/users/2 - returns specific user details", async ({ request }) => {
    const res = await request.get(`${BASE}/api/users/2`, { headers });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const user = body.data;

    expect(user.id).toBe(2);
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(user.first_name).toBeTruthy();
    expect(user.last_name).toBeTruthy();
  });

  test("GET /api/users/2 - non-existent user returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/users/999`, { headers });
    expect(res.status()).toBe(404);
  });
});