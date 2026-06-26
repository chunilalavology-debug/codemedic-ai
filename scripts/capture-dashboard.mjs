import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const email = `demo+${Date.now()}@codemedic.test`;
const password = "DemoPass123!";
const name = "Demo User";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(`${baseUrl}/signup`, { waitUntil: "networkidle" });
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/overview/, { timeout: 15000 }).catch(async () => {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/overview/, { timeout: 15000 });
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "public/docs/dashboard-overview.png", fullPage: false });

  await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "public/docs/dashboard-settings.png", fullPage: false });
} catch (error) {
  console.error("Dashboard capture failed:", error.message);
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "public/docs/dashboard-login-gateway.png", fullPage: false });
  process.exitCode = 1;
} finally {
  await browser.close();
}
