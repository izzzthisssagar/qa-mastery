import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

/**
 * docs/known-issues/dashboard-blank-first-paint.md — root cause was
 * `(app)/template.tsx` wrapping every authenticated route in `<Reveal>`
 * (fade defaults true, `initial={{opacity:0}}`), plus the dashboard/learn
 * hero `Reveal`s double-gating the LCP element. Chromium-only: CDP's
 * `Emulation.setCPUThrottlingRate` / `Network.emulateNetworkConditions`
 * aren't available on WebKit.
 */
test.describe("dashboard first paint (throttled)", () => {
  test("h1 is visible at first paint under 6x CPU + slow 4G, 20 consecutive cold-cache loads", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "CDP throttling is chromium-only");
    // test.slow()'s 3x (90s) isn't enough budget for 20 cold-cache reloads
    // under 6x CPU + slow 4G — it died at/near the last iteration on every
    // attempt even isolated on its own runner (playwright.first-paint.config.ts,
    // workers: 1), never a real hang. 4 min gives real margin without masking
    // an actual regression (a genuine blank-paint failure fails immediately
    // via the per-iteration assertion, not via this outer timeout).
    test.setTimeout(240_000);

    await signUpFreshLearner(page, "firstpaint");

    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      // Slow 4G: ~400kb/s down, ~400kb/s up.
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    for (let i = 0; i < 20; i++) {
      await client.send("Network.setCacheDisabled", { cacheDisabled: true });
      await page.reload({ waitUntil: "domcontentloaded" });

      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1, `blank paint on load ${i + 1}/20`).toBeVisible();
      await expect(h1, `blank paint on load ${i + 1}/20`).toHaveCSS("opacity", "1");
    }
  });
});
