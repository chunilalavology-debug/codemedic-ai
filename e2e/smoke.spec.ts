import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your AI-Powered Dev Platform", level: 1 })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/i }).first()).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Create an account")).toBeVisible();
  });
});

test.describe("Auth redirect", () => {
  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Invite page", () => {
  test("invalid invite shows error", async ({ page }) => {
    await page.goto("/invite/invalid-token-12345");
    await expect(page.getByText(/Workspace invitation/i)).toBeVisible();
    await expect(page.getByText(/not found|Invalid/i)).toBeVisible({ timeout: 10_000 });
  });
});
