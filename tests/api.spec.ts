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

test.describe("Scenario 5: Delayed response handling", () => {
  test("GET /api/users?delay=3 - returns data within expected timeframe", async ({ request }) => {
    const startTime = Date.now();
    const res = await request.get(`${BASE}/api/users?delay=3`, { headers });
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body.data.length).toBeGreaterThan(0);

    expect(duration).toBeGreaterThanOrEqual(3000);
  });

  test("GET /api/users?delay=1 - responds faster than delay=3", async ({ request }) => {
    const startTime1 = Date.now();
    await request.get(`${BASE}/api/users?delay=1`, { headers });
    const duration1 = Date.now() - startTime1;

    const startTime2 = Date.now();
    await request.get(`${BASE}/api/users?delay=3`, { headers });
    const duration2 = Date.now() - startTime2;

    expect(duration1).toBeLessThan(duration2);
  });
});

test.describe("Scenario 6: Chained requests - list then detail", () => {
  test("fetch list, pick a user, fetch details and validate", async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/users?page=1`, { headers });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.data)).toBeTruthy();
    expect(listBody.data.length).toBeGreaterThan(0);

    const userFromList = listBody.data[0];
    const id = userFromList.id;

    const detailRes = await request.get(`${BASE}/api/users/${id}`, { headers });
    expect(detailRes.status()).toBe(200);
    const detailBody = await detailRes.json();
    const userDetail = detailBody.data;

    expect(userDetail.id).toBe(id);
    expect(userDetail.email).toBe(userFromList.email);
    expect(userDetail.first_name).toBe(userFromList.first_name);
    expect(userDetail.last_name).toBe(userFromList.last_name);
  });
});