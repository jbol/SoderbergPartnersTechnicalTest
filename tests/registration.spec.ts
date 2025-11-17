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
  await page.getByTestId("customer.username").fill("testuser12");
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
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.locator('input[name="username"]').fill("testuser12");
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