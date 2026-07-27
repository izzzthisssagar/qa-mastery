import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * P2-8: (app)/template.tsx remounts on every navigation, and RouteFocusHeading
 * (src/components/route-focus.tsx) uses that remount to move focus to the new
 * page's <h1> — otherwise a screen-reader user's focus stays on the stale nav
 * control after an in-app route change (WCAG 2.4.3).
 */
test.describe("route-change focus management", () => {
  test("focus lands on the page heading after an in-app navigation", async ({ page }) => {
    await signUpFreshLearner(page, "route-focus");

    const dashboardHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(dashboardHeading).toBeFocused();

    // Client-side nav via the hub grid (not a full page load) still remounts
    // the template, so focus should move to the community page's own <h1>.
    await page.getByTestId("hub-card-community").click();
    await expect(page).toHaveURL(/\/community/);
    const communityHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(communityHeading).toBeFocused();
  });
});
