import { test, expect, type Page } from "@playwright/test";
import { TEST_IDEAS } from "./ideas";

const TIMEOUT = 180_000;

test.describe("ENMAX Spark — Landing Page", () => {
  test("has correct title and heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ENMAX Spark/);
    await expect(page.getByText("What are you thinking?")).toBeVisible();
  });

  test("shows persona avatars", async ({ page }) => {
    await page.goto("/");
    const avatars = page.locator("img[alt='Dayee'], img[alt='Nathan'], img[alt='Dana'], img[alt='Lalindra'], img[alt='Kyle']");
    await expect(avatars).toHaveCount(5);
  });

  test("input textarea is visible and functional", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill("Test idea");
    await expect(textarea).toHaveValue("Test idea");
  });

  test("submit button is disabled when input is empty", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("button").filter({ has: page.locator("svg") }).last();
    await expect(btn).toBeDisabled();
  });
});

test.describe("ENMAX Spark — Evaluation Flow", () => {
  test("spec FAB appears after submission", async ({ page }) => {
    test.setTimeout(60_000);
    const idea = TEST_IDEAS[3]!;

    await page.goto("/");
    await page.locator("textarea").fill(idea.idea);
    await page.locator("textarea").press("Enter");

    const fab = page.getByTestId("spec-fab");
    await expect(fab).toBeVisible({ timeout: 10_000 });
  });

  test("clicking spec FAB opens the drawer with skeleton sections", async ({ page }) => {
    test.setTimeout(60_000);
    const idea = TEST_IDEAS[3]!;

    await page.goto("/");
    await page.locator("textarea").fill(idea.idea);
    await page.locator("textarea").press("Enter");

    await expect(page.getByTestId("spec-fab")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("spec-fab").click();

    await expect(page.getByTestId("spec-document")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Verdict")).toBeVisible();
    await expect(page.getByText("Security & Compliance")).toBeVisible();
    await expect(page.getByText("Technical Architecture")).toBeVisible();
  });

  test("agents appear and complete during evaluation", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    const idea = TEST_IDEAS[3]!;

    await page.goto("/");
    await page.locator("textarea").fill(idea.idea);
    await page.locator("textarea").press("Enter");

    const thinkingOrAgent = page.locator("text=/thinking|Dayee|Nathan|Dana|Lalindra|Kyle/").first();
    await expect(thinkingOrAgent).toBeVisible({ timeout: 15_000 });

    const discussion = page.locator("text=Team Discussion").first();
    await expect(discussion).toBeVisible({ timeout: TIMEOUT - 30_000 });
  });

  test("can answer agent question and get followup", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    const idea = TEST_IDEAS[0]!;

    await page.goto("/");
    await page.locator("textarea").fill(idea.idea);
    await page.locator("textarea").press("Enter");

    const questionInput = page.locator("input[placeholder='Type your answer...']");
    const hasQuestion = await questionInput.isVisible({ timeout: 60_000 }).catch(() => false);

    if (hasQuestion && idea.answer) {
      await questionInput.fill(idea.answer);
      await questionInput.press("Enter");

      const followup = page.getByText("Updated take").first();
      await expect(followup).toBeVisible({ timeout: 30_000 });
    }
  });
});

test.describe("ENMAX Spark — Spec Building", () => {
  test("spec sections fill with content as agents work", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    const idea = TEST_IDEAS[3]!;

    await page.goto("/");
    await page.locator("textarea").fill(idea.idea);
    await page.locator("textarea").press("Enter");

    await expect(page.getByTestId("spec-fab")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("spec-fab").click();
    await expect(page.getByTestId("spec-document")).toBeVisible();

    const securityContent = page.getByTestId("spec-content-security");
    await expect(securityContent).toBeVisible({ timeout: 90_000 });
    const securityText = await securityContent.textContent();
    expect(securityText!.length).toBeGreaterThan(20);
  });

  test("spec auto-opens when evaluation completes", async ({ page }) => {
    test.setTimeout(TIMEOUT);
    const idea = TEST_IDEAS[3]!;

    await page.goto("/");
    await page.locator("textarea").fill(idea.idea);
    await page.locator("textarea").press("Enter");

    const specDoc = page.getByTestId("spec-document");
    await expect(specDoc).toBeVisible({ timeout: TIMEOUT });

    const verdictContent = page.getByTestId("spec-content-verdict");
    await expect(verdictContent).toBeVisible({ timeout: 30_000 });
  });

  for (const testData of TEST_IDEAS.slice(0, 2)) {
    test(`full evaluation produces spec with keywords for: ${testData.name}`, async ({ page }) => {
      test.setTimeout(TIMEOUT);
      await runEvaluation(page, testData);
    });
  }
});

test.describe("ENMAX Spark — Session History", () => {
  test("session appears in sidebar after creation", async ({ page }) => {
    test.setTimeout(TIMEOUT);

    await page.goto("/");
    await page.locator("textarea").fill("Quick sidebar test idea");
    await page.locator("textarea").press("Enter");

    await page.waitForTimeout(3_000);

    const sidebarToggle = page.locator("button").filter({ has: page.locator("svg") }).first();
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await expect(page.getByText("Quick sidebar test idea")).toBeVisible();
    }
  });
});

async function runEvaluation(page: Page, testData: (typeof TEST_IDEAS)[number]) {
  await page.goto("/");

  const textarea = page.locator("textarea");
  await textarea.fill(testData.idea);
  await textarea.press("Enter");

  if (testData.answer) {
    const questionInput = page.locator("input[placeholder='Type your answer...']");
    const hasQuestion = await questionInput.isVisible({ timeout: 60_000 }).catch(() => false);

    if (hasQuestion) {
      await questionInput.fill(testData.answer);
      await questionInput.press("Enter");
    }
  }

  const specDoc = page.getByTestId("spec-document");
  await expect(specDoc).toBeVisible({ timeout: TIMEOUT });

  const verdictContent = page.getByTestId("spec-content-verdict");
  await expect(verdictContent).toBeVisible({ timeout: 30_000 });

  const specText = await specDoc.textContent({ timeout: 5_000 });
  expect(specText).toBeTruthy();

  for (const keyword of testData.expectedKeywords.slice(0, 2)) {
    const lower = specText!.toLowerCase();
    expect(
      lower,
      `Expected spec to contain "${keyword}"`
    ).toContain(keyword.toLowerCase());
  }
}
