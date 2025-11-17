import { test, expect } from "@playwright/test";

const FIRST_NAME = "John";
const LAST_NAME = "Doe";
const STREET = "123 Main St";
const CITY = "Anytown";
const STATE = "CA";
const ZIP = "90210";
const PHONE = "555-0100";
const SSN = "123-45-6789";
const USERNAME = "testuser12";
const NEW_PHONE = "555-0200";

test.beforeEach(async ({ page }) => {
  await page.goto("https://parabank.parasoft.com/parabank/index.htm?ConnType=JDBC");
});

test("Flow 1: Registration, update contact info, update profile, logout", async ({ page }) => {
  await page.getByRole("link", { name: /register/i }).click();

  await page.getByTestId("customer.firstName").fill(FIRST_NAME);
  await page.getByTestId("customer.lastName").fill(LAST_NAME);
  await page.getByTestId("customer.address.street").fill(STREET);
  await page.getByTestId("customer.address.city").fill(CITY);
  await page.getByTestId("customer.address.state").fill(STATE);
  await page.getByTestId("customer.address.zipCode").fill(ZIP);
  await page.getByTestId("customer.phoneNumber").fill(PHONE);
  await page.getByTestId("customer.ssn").fill(SSN);
  await page.getByTestId("customer.username").fill(USERNAME);
  await page.locator('input[id="customer.password"]').fill("Passw0rd!123");
  await page.locator('input[id="repeatedPassword"]').fill("Passw0rd!123");

  await Promise.all([
    page.waitForNavigation(),
    page.getByRole("button", { name: /register/i }).click()
  ]);

  await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();
  await expect(page.getByText(new RegExp(`welcome\\s+${FIRST_NAME}`, "i"))).toBeVisible();

  await page.getByRole("link", { name: /update contact info/i }).click();
  await expect(page.getByTestId("customer.firstName")).toHaveValue(FIRST_NAME);
  await expect(page.getByTestId("customer.lastName")).toHaveValue(LAST_NAME);
  await expect(page.getByTestId("customer.address.street")).toHaveValue(STREET);
  await expect(page.getByTestId("customer.address.city")).toHaveValue(CITY);
  await expect(page.getByTestId("customer.address.state")).toHaveValue(STATE);
  await expect(page.getByTestId("customer.address.zipCode")).toHaveValue(ZIP);
  await expect(page.getByTestId("customer.phoneNumber")).toHaveValue(PHONE);

  await page.getByTestId("customer.phoneNumber").fill(NEW_PHONE);
  await Promise.all([
    page.getByRole("button", { name: /update/i }).click()
  ]);

  await page.getByRole("link", { name: /update contact info/i }).click();
  await expect(page.getByTestId("customer.phoneNumber")).toHaveValue(NEW_PHONE);

  await page.getByRole("link", { name: /log out/i }).click();
  await expect(page.getByRole("heading", { name: /customer login/i })).toBeVisible();
});

test("Flow 2: Login with existing user and visual snapshots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.locator('input[name="username"]').fill(USERNAME);
  await page.locator('input[name="password"]').fill("Passw0rd!123");
  await Promise.all([
    page.waitForNavigation(),
    page.getByRole("button", { name: /log ?in|sign in/i }).click()
  ]);

  await page.waitForLoadState("networkidle");
  await page.addStyleTag({ content: `* { transition: none !important; animation: none !important; caret-color: transparent !important; }` });

  const container = await (await page.locator('text=Account Overview').first().elementHandle()) ?? (await page.locator('body').elementHandle());

  const accountShot = container
    ? await (await container).screenshot()
    : await page.screenshot({ fullPage: true });

  expect(accountShot).toMatchSnapshot("flow2-account.png", { maxDiffPixelRatio: 0.02 });

  await page.getByRole("link", { name: /update contact info/i }).click();
  await page.waitForLoadState("networkidle");

  const updateShot = await page.screenshot({ fullPage: true });
  expect(updateShot).toMatchSnapshot("flow2-update-contact.png", { maxDiffPixelRatio: 0.02 });

  await page.getByRole("link", { name: /log out/i }).click();
  await page.waitForLoadState("networkidle");

  const afterLogoutShot = await page.screenshot({ fullPage: true });
  expect(afterLogoutShot).toMatchSnapshot("flow2-after-logout.png", { maxDiffPixelRatio: 0.02 });
});