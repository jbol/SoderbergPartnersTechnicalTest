import { test, expect } from "@playwright/test";

const BASE = "https://reqres.in";
const API_KEY = "reqres-free-v1";
const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

test.describe("Scenario 1: Authentication scenarios", () => {
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

test.describe("Scenario 2: User details endpoint", () => {
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

test.describe("Scenario 3: Create user endpoint", () => {
  test("POST /api/users - create user with valid name and job", async ({ request }) => {
    const res = await request.post(`${BASE}/api/users`, {
      headers,
      data: {
        name: "John",
        job: "developer",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    
    expect(body).toHaveProperty("id");
    expect(body.name).toBe("John");
    expect(body.job).toBe("developer");
    expect(body).toHaveProperty("createdAt");
  });

    test("POST /api/users - missing name field still creates user", async ({ request }) => {
    const res = await request.post(`${BASE}/api/users`, {
      headers,
      data: {
        job: "developer",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id");
  });

  test("POST /api/users - missing job field still creates user", async ({ request }) => {
    const res = await request.post(`${BASE}/api/users`, {
      headers,
      data: {
        name: "John",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id");
  });
});

test.describe("Scenario 4: Pagination handling", () => {
  test("GET /api/users?page=2 - returns correct paginated data", async ({ request }) => {
    const res = await request.get(`${BASE}/api/users?page=2`, { headers });

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("per_page");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("total_pages");
    expect(body).toHaveProperty("data");

    expect(body.page).toBe(2);
    expect(body.data.length).toBe(body.per_page);
  });

  test("GET /api/users - page 1 and page 2 return unique users", async ({ request }) => {
    const res1 = await request.get(`${BASE}/api/users?page=1`, { headers });
    const body1 = await res1.json();
    const page1Users = body1.data.map((user: any) => user.id);

    const res2 = await request.get(`${BASE}/api/users?page=2`, { headers });
    const body2 = await res2.json();
    const page2Users = body2.data.map((user: any) => user.id);

    const commonUsers = page1Users.filter((id: number) => page2Users.includes(id));
    expect(commonUsers.length).toBe(0);
  });
});