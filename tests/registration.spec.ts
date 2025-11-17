import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("https://parabank.parasoft.com/parabank/index.htm?ConnType=JDBC");
});

test("Flow 1: Registration, update contact info, update profile, logout", async ({ page }) => {
  await page.getByRole("link", { name: /register/i }).click();

  await page.getByTestId("customer.firstName").fill("John");
  await page.getByTestId("customer.lastName").fill("Doe");
  await page.getByTestId("customer.address.street").fill("123 Main St");
  await page.getByTestId("customer.address.city").fill("Anytown");
  await page.getByTestId("customer.address.state").fill("CA");
  await page.getByTestId("customer.address.zipCode").fill("90210");
  await page.getByTestId("customer.phoneNumber").fill("555-0100");
  await page.getByTestId("customer.ssn").fill("123-45-6789");
  await page.getByTestId("customer.username").fill("testuse6");
  await page.locator('input[id="customer.password"]').fill("Passw0rd!123");
  await page.locator('input[id="repeatedPassword"]').fill("Passw0rd!123");

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole("button", { name: /register/i }).click()
  ]);

  await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();
  await expect(page.getByText(/welcome\s+John/i)).toBeVisible();

  await page.getByRole("link", { name: /update contact info/i }).click();
  await expect(page.getByTestId("customer.firstName")).toHaveValue("John");
  await expect(page.getByTestId("customer.lastName")).toHaveValue("Doe");
  await expect(page.getByTestId("customer.address.street")).toHaveValue("123 Main St");
  await expect(page.getByTestId("customer.address.city")).toHaveValue("Anytown");
  await expect(page.getByTestId("customer.address.state")).toHaveValue("CA");
  await expect(page.getByTestId("customer.address.zipCode")).toHaveValue("90210");
  await expect(page.getByTestId("customer.phoneNumber")).toHaveValue("555-0100");

  await page.getByTestId("customer.phoneNumber").fill("555-0200");
  await Promise.all([
    page.getByRole("button", { name: /update/i }).click()
  ]);

  await page.getByRole("link", { name: /update contact info/i }).click();
  await expect(page.getByTestId("customer.phoneNumber")).toHaveValue("555-0200");

  await page.getByRole("link", { name: /log out/i }).click();
  await expect(page.getByRole("heading", { name: /customer login/i })).toBeVisible();
});

test("Flow 2: Login with existing user and visual snapshots", async ({ page }) => {
  await page.locator('input[name="username"]').fill("testuser6");
  await page.locator('input[name="password"]').fill("Passw0rd!123");
  await Promise.all([
    page.waitForNavigation(),
    page.getByRole("button", { name: /log ?in|sign in/i }).click()
  ]);

  await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot("flow2-account.png");

  await page.getByRole("link", { name: /update contact info/i }).click();
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot("flow2-update-contact.png");

  await page.getByRole("link", { name: /log out/i }).click();
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot("flow2-after-logout.png");
});