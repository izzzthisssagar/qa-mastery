import { expect, test } from "@playwright/test";
import { publishTester, signUp, uniqueHandle } from "./talent-helpers";

/**
 * Talent — the signature test (Test-Plan §4.2): two browser contexts (client +
 * tester). A client contacts a tester and sends a message; the tester sees it —
 * including a live message pushed over the RLS-authorized Postgres Changes
 * subscription, with no reload. Also exercises the consent boundary: the
 * conversation only exists because the client hit Contact.
 */
test.describe("talent — realtime messaging", () => {
  test("a message sent by the client reaches the tester (incl. live push)", async ({ browser }) => {
    const testerCtx = await browser.newContext();
    const clientCtx = await browser.newContext();
    const tester = await testerCtx.newPage();
    const client = await clientCtx.newPage();

    // Tester publishes a profile.
    await signUp(tester);
    const handle = uniqueHandle();
    await publishTester(tester, handle);

    // Client signs up, opens the profile, and contacts the tester.
    await signUp(client);
    await client.goto(`http://localhost:3000/talent/u/${handle}`);
    await client.getByRole("button", { name: /^contact$/i }).click();
    await expect(client).toHaveURL(/\/talent\/inbox\/[0-9a-f-]+/);
    const convUrl = client.url();

    // Client sends the first message.
    await client.getByLabel("Message").fill("hello from the client");
    await client.getByRole("button", { name: /^send$/i }).click();
    await expect(client.getByText("hello from the client")).toBeVisible();

    // Tester opens the same thread and sees the persisted first message.
    await tester.goto(convUrl);
    await expect(tester.getByText("hello from the client")).toBeVisible({ timeout: 15_000 });

    // LIVE PUSH: client sends a second message; the tester sees it without reload.
    await client.getByLabel("Message").fill("are you available next week?");
    await client.getByRole("button", { name: /^send$/i }).click();
    await expect(tester.getByText("are you available next week?")).toBeVisible({ timeout: 20_000 });

    await testerCtx.close();
    await clientCtx.close();
  });
});
