import { expect, test } from "@playwright/test";
import { publishTester, signUp, uniqueHandle } from "./talent-helpers";

/**
 * Talent — consent boundary (Test-Plan §4.3). A conversation between a client
 * and a tester must NOT be readable by a third user who navigates straight to
 * its URL. RLS returns nothing → the thread 404s; the message never renders.
 */
test.describe("talent — consent boundary", () => {
  test("a non-participant cannot read a conversation by direct URL", async ({ browser }) => {
    const clientCtx = await browser.newContext();
    const testerCtx = await browser.newContext();
    const outsiderCtx = await browser.newContext();
    const client = await clientCtx.newPage();
    const tester = await testerCtx.newPage();
    const outsider = await outsiderCtx.newPage();

    // Tester publishes; client contacts and sends a private message.
    await signUp(tester);
    const handle = uniqueHandle();
    await publishTester(tester, handle);

    await signUp(client);
    await client.goto(`http://localhost:3000/talent/u/${handle}`);
    await client.getByRole("button", { name: /^contact$/i }).click();
    await expect(client).toHaveURL(/\/talent\/inbox\/[0-9a-f-]+/);
    const convUrl = client.url();
    await client.getByLabel("Message").fill("a private message");
    await client.getByRole("button", { name: /^send$/i }).click();
    await expect(client.getByText("a private message")).toBeVisible();

    // A third user signs up and tries the conversation URL directly.
    await signUp(outsider);
    await outsider.goto(convUrl);

    // The private message must not be visible, and the composer must be absent.
    await expect(outsider.getByText("a private message")).toHaveCount(0);
    await expect(outsider.getByLabel("Message")).toHaveCount(0);

    await clientCtx.close();
    await testerCtx.close();
    await outsiderCtx.close();
  });
});
