import { expect, test } from "@playwright/test";

test("candidate can start an interview and see the live room", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Start interview" })).toBeVisible();
  await page.getByPlaceholder("Enter your name").fill("E2E Candidate");
  await page.getByRole("button", { name: "Start interview" }).click();

  await expect(page).toHaveURL(/\/interview\/session-/);
  await expect(page.locator(".sname").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Interviewer/ })).toBeVisible();
  await expect(page.getByText("Scratch Pad")).toBeVisible();
  await expect(page.getByText("Shared brief")).toBeVisible();
});

test("candidate can message the interviewer and create a private note", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Enter your name").fill("Browser Test");
  await page.getByRole("button", { name: "Start interview" }).click();
  await expect(page).toHaveURL(/\/interview\/session-/);

  const initialBubbles = page.locator(".bubble, .bub");
  const initialCount = await initialBubbles.count();

  await page.locator(".conversation textarea").first().fill("How strict is ordering within each conversation?");
  await page.getByRole("button", { name: "Send" }).click();

  await expect.poll(async () => initialBubbles.count(), { timeout: 60000 }).toBeGreaterThan(
    initialCount,
  );

  await page.getByRole("combobox").selectOption("Open question");
  await page
    .getByPlaceholder("Capture a requirement, risk, tradeoff, or open question.")
    .fill("Need to confirm offline storage strategy.");
  await page.getByRole("button", { name: "Add note" }).click();

  await expect(page.getByText("Need to confirm offline storage strategy.")).toBeVisible();
});
