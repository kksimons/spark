import { test, expect } from "@playwright/test";

const BASE = "https://spark.kylesimons.ca";

test.describe("ENMAX Spark — Live Deploy", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/ENMAX Spark/);
    await expect(page.getByText("What are you thinking?")).toBeVisible();
  });

  test("persona avatars render", async ({ page }) => {
    await page.goto(BASE);
    const avatars = page.locator(
      "img[alt='Dayee'], img[alt='Nathan'], img[alt='Dana'], img[alt='Lalindra'], img[alt='Kyle']"
    );
    await expect(avatars).toHaveCount(5);
  });

  test("health API returns ok", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.hasApiKey).toBe(true);
  });
});
