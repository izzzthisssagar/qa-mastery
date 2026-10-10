import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";
import { setTheme, waitForTheme } from "./theme-helper";

/**
 * Sprint 03: AUTHENTICATED lesson acceptance on CI's disposable local Supabase.
 *
 * Existing CI e2e-core owns the local Supabase database, applies migrations,
 * seeds the curriculum, starts the platform and Playwright browser. This file
 * is auto-collected by the existing core config; it never uses hosted data.
 *
 * Only a temporary @e2e.local signup and ungraded checklist clicks are made.
 * Intentionally DO NOT click Mark complete, submit XP/grading or run code.
 * Saved screenshots are scoped to the static article, not account chrome.
 * Avoid traces/videos/failure screenshots that may contain auth session data.
 */
const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const url = new URL(BASE);
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.protocol !== "http:") {
  throw new Error("Manual BVA authenticated E2E only runs against local, disposable Supabase.");
}
const NOTE = BASE + "/notes/test-design-techniques/boundary-value-analysis/bva-worked-example";
const imagePath =
  "/notes/test-design-techniques/boundary-value-analysis/buggyshop-cart-v2-original.png";
const templatePath = "/labs/manual-qa-v2/BVA_EVIDENCE_TEMPLATE.md";
const widths = [390, 768, 1440] as const;

test.use({ trace: "off", screenshot: "off", video: "off" });

test.describe("Sprint 03 BVA manual-first lesson — disposable CI learner", () => {
  test("signed-in note renders, checklist works, template loads, and both themes capture", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await setTheme(page, "light");
    await signUpFreshLearner(page, "s03bva");
    const response = await page.goto(NOTE, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(NOTE);
    const article = page.getByRole("article");
    await expect(article).toBeVisible();
    await expect(
      article.getByRole("heading", { name: "Manual-first BuggyShop boundary practice" }),
    ).toBeVisible();
    await expect(article.getByText(/without writing Python/i)).toBeVisible();
    await expect(article.getByText(/ungraded practice/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /mark complete.*xp/i })).toBeVisible();

    const picture = article.locator('img[src*="buggyshop-cart-v2-original.png"]');
    await expect(picture).toHaveCount(1);
    await expect(picture).toHaveAttribute("src", imagePath);
    await expect(picture).toHaveAttribute("alt", /BuggyShop cart showing one item/i);
    await expect
      .poll(async () =>
        picture.evaluate((element) => {
          const img = element as unknown as { complete: boolean; naturalWidth: number };
          return img.complete && img.naturalWidth >= 1200;
        }),
      )
      .toBe(true);
    const figure = picture.locator("xpath=ancestor::figure");
    await expect(figure.getByText(/genuine BuggyShop cart captured/i)).toBeVisible();

    const template = article.getByRole("link", {
      name: "blank BVA test-case and evidence template",
    });
    await expect(template).toHaveAttribute("href", templatePath);
    const templateResponse = await page.request.get(BASE + templatePath);
    expect(templateResponse.status()).toBe(200);
    const worksheet = await templateResponse.text();
    expect(worksheet).toContain("BVA-01");
    expect(worksheet).toContain("NOT RUN");
    expect(worksheet).toContain("BLOCKED");

    const mission = article
      .getByRole("heading", {
        name: "Manual QA mission: design, execute, and explain three boundary cases",
      })
      .locator("xpath=ancestor::section[1]");
    await expect(mission).toBeVisible();
    const progress = mission.getByText(/^0 \/ 5 done$/);
    await expect(progress).toBeVisible();
    const firstStep = mission.getByRole("listitem").first().getByRole("button");
    await firstStep.focus();
    await expect(firstStep).toBeFocused();
    await expect(async () => {
      if ((await mission.getByText(/^\d+ \/ 5 done$/).innerText()).startsWith("0")) {
        await firstStep.press("Enter");
      }
      await expect(mission.getByText(/^1 \/ 5 done$/)).toBeVisible({ timeout: 1200 });
    }).toPass({ timeout: 10_000 });

    async function validateAndCapture(theme: "light" | "dark") {
      await waitForTheme(page, theme);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await expect(
          article.getByRole("heading", {
            name: "Manual-first BuggyShop boundary practice",
          }),
        ).toBeVisible();
        await expect(picture).toBeVisible();
        const layout = await page.locator("html").evaluate((element) => ({
          pageWidth: element.scrollWidth,
          viewportWidth: element.clientWidth,
        }));
        expect(layout.viewportWidth).toBe(width);
        expect(
          layout.pageWidth,
          `page overflows at ${width}px in ${theme} theme`,
        ).toBeLessThanOrEqual(width + 1);

        // A whole-article screenshot exceeds WebKit's 32,767px limit.
        // The entire checklist is also taller than a mobile viewport, so
        // stitched element screenshots repeat fixed nav/Feedback over text.
        // Preserve unmodified UI and capture each shorter practice element
        // within the normal viewport, clear of those fixed controls.
        const evidenceItems = await mission.getByRole("listitem").all();
        expect(evidenceItems).toHaveLength(5);
        for (const region of [
          { name: "reference-figure", locator: figure },
          ...evidenceItems.map((locator, index) => ({
            name: `checklist-step-${index + 1}`,
            locator,
          })),
        ]) {
          const target = region.locator;
          await expect(target).toBeVisible();
          await target.scrollIntoViewIfNeeded();
          await target.evaluate((element) => {
            const view = element.ownerDocument.defaultView;
            if (!view) throw new Error("Browser viewport unavailable");
            const top = element.getBoundingClientRect().top + view.scrollY;
            view.scrollTo({ top: Math.max(0, top - 155), behavior: "auto" });
          });
          const bounds = await target.boundingBox();
          expect(bounds, "practice element must have a measurable rectangle").not.toBeNull();
          expect(
            bounds!.height,
            "practice element must fit in a normal viewport",
          ).toBeLessThanOrEqual(620);
          expect(bounds!.y, "practice element must clear the fixed header").toBeGreaterThanOrEqual(
            95,
          );
          expect(
            bounds!.y + bounds!.height,
            "practice element must clear the fixed footer UI",
          ).toBeLessThanOrEqual(785);
          const attachmentName = `bva-${region.name}-${theme}-${width}`;
          const file = testInfo.outputPath(`${attachmentName}.png`);
          await target.screenshot({
            path: file,
            animations: "disabled",
            timeout: 15_000,
          });
          await testInfo.attach(attachmentName, {
            path: file,
            contentType: "image/png",
          });
        }
      }
    }

    await validateAndCapture("light");

    // Exercise the actual theme control rather than altering production code.
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: /Dark mode/i }).click();
    await validateAndCapture("dark");

    // No completion clicks, XP awards, hidden bug-manifest access or grading.
    await expect(page.getByRole("button", { name: /mark complete.*xp/i })).toBeVisible();
  });
});
