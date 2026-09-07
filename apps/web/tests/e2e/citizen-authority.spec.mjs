import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac } from "node:crypto";

const FLAGSHIP_CASE = "CN-DEMO-WRONG-VEHICLE";
const WHATSAPP_FIXTURE_SECRET = "challan-nyay-synthetic-whatsapp-app-secret-v1";

async function sendWhatsAppFixture(request, { id, text, command, from = "919900004321" }) {
  const message = command
    ? { id, from, type: "interactive", interactive: { list_reply: { id: command, title: "Selected" } } }
    : { id, from, type: "text", text: { body: text } };
  const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [message] } }] }] });
  const signature = `sha256=${createHmac("sha256", WHATSAPP_FIXTURE_SECRET).update(body).digest("hex")}`;
  const response = await request.post("/api/channels/whatsapp/webhook", {
    data: body,
    headers: { "content-type": "application/json", "x-hub-signature-256": signature },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function completeProtectedLookup(page, { query, expectedCase = FLAGSHIP_CASE } = {}) {
  if (query) {
    await page.locator("#lookup-query").fill(query);
  }
  const expression = page.locator(".human-check strong");
  await expect(expression).toContainText("+");
  const [left, right] = (await expression.innerText())
    .split("+")
    .map((value) => Number(value.trim()));
  await page.locator(".human-check input").fill(String(left + right));
  await page.getByRole("button", { name: "Open challan" }).click();
  await expect(page).toHaveURL(new RegExp(`/challans/${expectedCase}$`));
}

async function expectNoSeriousAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
  const blocking = results.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));
  expect(blocking).toEqual([]);
}

test("citizen grievance becomes a reasoned authority outcome and survives refresh", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Understand your challan. Move forward with clarity." })).toBeVisible();
  await completeProtectedLookup(page, { query: "TS09CD5678" });

  await expect(page.getByRole("heading", { name: "Possible vehicle mismatch in the evidence" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Evidence integrity passport" })).toContainText("Lineage complete");
  await expect(page.getByText("Vehicle body or colour does not match", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Contest this challan" }).click();
  await expect(page.getByRole("heading", { name: "Raise a dispute" })).toBeVisible();
  await page.getByRole("checkbox", { name: /I understand this is a synthetic demonstration/ }).check();
  await page.getByRole("button", { name: "Submit contest" }).click();
  await expect(page.getByRole("heading", { name: "Your contest is in the review queue" })).toBeVisible();
  await expect(page.getByText(/Receipt CN-RCPT-/).first()).toBeVisible();

  await page.goto("/authority");
  await page.getByRole("button", { name: "Open reviewer workspace" }).click();
  await expect(page.getByRole("heading", { name: "Authority operations" })).toBeVisible();
  const flagshipRow = page.getByRole("button", { name: new RegExp(FLAGSHIP_CASE) });
  await expect(flagshipRow).toBeVisible();
  await flagshipRow.click();
  await page.getByRole("button", { name: "Claim for 30 minutes" }).click();
  await expect(page.getByText("Claimed by this reviewer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Quash with reasons" }).click();

  await page.goto(`/challans/${FLAGSHIP_CASE}`);
  await expect(page.getByRole("heading", { name: "This challan has been quashed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Challan quashed", exact: true })).toBeVisible();
  await expect(page.getByText("Decision issued", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "This challan has been quashed" })).toBeVisible();

  await page.goto("/authority");
  await page.getByRole("button", { name: "Reset synthetic data" }).click();
  await page.goto(`/challans/${FLAGSHIP_CASE}`);
  await expect(page.getByRole("heading", { name: "Possible vehicle mismatch in the evidence" })).toBeVisible();
});

test("mobile low-data and high-contrast modes preserve the primary task", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("challan-nyay-low-data", "true");
    localStorage.setItem("challan-nyay-high-contrast", "false");
  });
  await page.goto("/");

  await expect(page.locator(".gateway-hero-art")).toHaveCount(0);
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBe(390);
  const settings = page.locator("details.mobile-utility-disclosure");
  await settings.locator("summary").click();
  await settings.getByRole("button", { name: "Contrast" }).click();
  await expect(page.locator(".app")).toHaveClass(/high-contrast/);
  await expectNoSeriousAccessibilityViolations(page);

  await completeProtectedLookup(page, { query: "TS09CD5678" });
  await expect(page.getByRole("button", { name: "Load evidence and map" })).toBeVisible();
  await expect(page.locator('img[alt="Synthetic enforcement frame showing the detected black scooter"]')).toHaveCount(0);
  const eventMap = page.getByRole("region", { name: "Event location map" }).locator("iframe");
  await expect(eventMap).toHaveCount(0);
  await page.getByRole("button", { name: "Load evidence and map" }).click();
  await expect(page.locator('img[alt="Synthetic enforcement frame showing the detected black scooter"]')).toHaveAttribute("src", "/assets/synthetic-enforcement-frame-preview.webp");
  await expect(eventMap).toBeVisible();

  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  await expect(page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth)).resolves.toBe("none");
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBe(390);
});

test("landing and separate reviewer sign-in have no serious axe violations", async ({ page }) => {
  await page.goto("/");
  await expectNoSeriousAccessibilityViolations(page);
  await page.goto("/authority");
  await expect(page.getByRole("heading", { name: "Reviewer sign in" })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test("vehicle, challan and driving-licence guest entries open distinct evidence cases", async ({ page }) => {
  const entries = [
    { label: "Vehicle number", expectedCase: "CN-GUEST-VEHICLE", retainedPlate: true },
    { label: "Challan number", expectedCase: "CN-GUEST-CHALLAN", retainedPlate: false },
    { label: "Driving licence", expectedCase: "CN-GUEST-LICENCE", retainedPlate: false },
  ];

  for (const entry of entries) {
    await page.goto("/");
    await page.locator(".lookup-tabs label").filter({ hasText: entry.label }).click();
    await completeProtectedLookup(page, { expectedCase: entry.expectedCase });
    await expect(page.locator(".enforcement-frame img")).toBeVisible();
    if (entry.retainedPlate) {
      await expect(page.locator(".plate-frame img")).toBeVisible();
    } else {
      await expect(page.locator(".plate-frame .plate-readout")).toBeVisible();
    }
    await expect(page.getByRole("region", { name: "Event location map" }).locator("iframe")).toBeVisible();
  }
});

test("guest vehicle lookup keeps its own evidence and returns to lookup even with an active account", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create demo account" }).click();
  await page.getByRole("button", { name: "Send demo OTP" }).click();
  await page.getByRole("textbox", { name: "Enter the six-digit demo OTP" }).fill("246810");
  await page.getByRole("button", { name: "Verify and open account" }).click();
  await expect(page).toHaveURL(/\/account$/);

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await completeProtectedLookup(page, { expectedCase: "CN-GUEST-VEHICLE" });

  await expect(page.locator(".enforcement-frame img")).toHaveAttribute(
    "src",
    "/assets/evidence/guest-vehicle-speed-camera-v1.webp",
  );
  await expect(page.locator(".plate-frame img")).toHaveAttribute(
    "src",
    "/assets/evidence/guest-vehicle-plate-v1.webp",
  );
  await expect(page.getByRole("button", { name: "Back to lookup" })).toBeVisible();
  await page.getByRole("button", { name: "Back to lookup" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Find your challan" })).toBeVisible();
});

test("browser Back and Forward stay synchronized with citizen routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);

  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Find your challan" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/services$/);

  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Find your challan" })).toBeVisible();
});

test("authority workspace is distinct and browser Back returns to the citizen page", async ({ page }) => {
  await page.goto("/");
  const authorityEntry = page.getByRole("button", { name: "Authority workspace" });
  await expect(authorityEntry).toBeVisible();
  await expect(authorityEntry).toHaveCSS("background-color", "rgb(16, 45, 114)");
  await authorityEntry.click();
  await expect(page).toHaveURL(/\/authority$/);
  await expect(page.getByRole("heading", { name: "Reviewer sign in" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Find your challan" })).toBeVisible();
});

test("demo account switches between multi-vehicle citizen profiles", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create demo account" }).click();
  await page.getByRole("button", { name: "Send demo OTP" }).click();
  await page.getByRole("textbox", { name: "Enter the six-digit demo OTP" }).fill("246810");
  await page.getByRole("button", { name: "Verify and open account" }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Amit Rao" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Honda CB350.*TS09CD5678/ })).toBeVisible();
  await page.getByRole("combobox", { name: "Demo profile" }).selectOption("DEMO-FLEET-02");
  await expect(page.getByRole("heading", { name: "Neha Logistics" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Delivery vehicle.*RJ14TR8801/ })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Demo profile" }).locator("option")).toHaveCount(3);
  await page.getByRole("combobox", { name: "Demo profile" }).selectOption("DEMO-CITIZEN-03");
  await expect(page.getByRole("heading", { name: "Farah Nair" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tata Nexon.*KL07MX4312/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Farah Nair" })).toBeVisible();
});

test("authority workspace starts with bounded non-zero queues and a real reviewer batch", async ({ page }) => {
  await page.goto("/authority");
  await page.getByRole("button", { name: "Open reviewer workspace" }).click();
  await expect(page.getByRole("heading", { name: "Authority operations" })).toBeVisible();
  await expect(page.locator(".authority-summary")).toContainText("My batch");
  await expect(page.locator(".authority-summary")).toContainText("3");
  await expect(page.getByRole("button", { name: /My batch.*3/ })).toBeVisible();
  await page.getByRole("button", { name: /My batch.*3/ }).click();
  await expect(page.locator(".authority-worklist-row")).toHaveCount(3);

  const evidenceImage = page.locator(".authority-case-section .review-evidence > img");
  await expect(evidenceImage).toBeVisible();
  await expect(evidenceImage.evaluate((image) => getComputedStyle(image).objectFit)).resolves.toBe("contain");
  await expect(evidenceImage.evaluate((image) => image.getBoundingClientRect().height)).resolves.toBeLessThanOrEqual(360);
});

test("WhatsApp issue guidance hands the verified citizen into the same web dispute", async ({ page, request }) => {
  const runId = Date.now();
  const prefix = `wamid.e2e.${runId}`;
  const from = `91${String(runId).slice(-10)}`;
  const send = (position, input) => sendWhatsAppFixture(request, { id: `${prefix}.${position}`, from, ...input });
  await send(1, { text: "Hi" });
  await send(2, { command: "LANG_EN" });
  await send(3, { command: "CHECK_CHALLAN" });
  await send(4, { text: "TS09CD5678" });
  await send(5, { command: "VERIFY_LOOKUP" });
  await send(6, { command: "VIEW_CHALLANS" });
  await send(7, { command: `CASE:${FLAGSHIP_CASE}` });
  await send(8, { command: `GRIEVANCE:${FLAGSHIP_CASE}` });
  await send(9, { command: "GROUND:ALREADY_PAID" });
  const handoff = await send(10, { command: "CONTINUE_GRIEVANCE" });
  const url = handoff.responses[0].body.match(/https?:\/\/\S+/)?.[0];
  expect(url).toBeTruthy();

  await page.goto(url);
  await expect(page).toHaveURL(new RegExp(`/challans/${FLAGSHIP_CASE}$`));
  await expect(page.getByRole("heading", { name: "Raise a dispute" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Already paid/ })).toBeChecked();
  await expect(page.getByLabel("Synthetic payment reference")).toHaveValue("DEMO-PAY-2026-4182");
});

test("WhatsApp pay-all handoff reviews and posts every selected challan atomically", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runId = Date.now();
  const prefix = `wamid.batch.${runId}`;
  const from = `92${String(runId).slice(-10)}`;
  const send = (position, input) => sendWhatsAppFixture(request, { id: `${prefix}.${position}`, from, ...input });
  await send(1, { text: "Hi" });
  await send(2, { command: "LANG_EN" });
  await send(3, { command: "CHECK_CHALLAN" });
  await send(4, { text: "TS09CD5678" });
  await send(5, { command: "VERIFY_LOOKUP" });
  const review = await send(6, { command: "PAY_ALL" });
  expect(review.responses[0].body).toContain("2 eligible challans");
  const handoff = await send(7, { command: "CONFIRM_PAY_ALL" });
  const url = handoff.responses[0].body.match(/https?:\/\/\S+/)?.[0];
  expect(url).toBeTruthy();

  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Review 2 challans" })).toBeVisible();
  await expect(page.getByText("Total synthetic amount")).toBeVisible();
  await expect(page.getByText("₹2,000")).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBe(390);
  await expect(page.locator(".app > main")).toHaveAttribute("aria-hidden", "true");
  await expectNoSeriousAccessibilityViolations(page);
  await page.getByRole("checkbox", { name: /synthetic batch payment/ }).check();
  await page.getByRole("button", { name: "Post 2 demo payments" }).click();
  await expect(page.getByRole("heading", { name: "Payment recorded in this demonstration" })).toBeVisible();
});

test("WhatsApp selected-payment handoff preserves only the citizen's chosen challans", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runId = Date.now();
  const prefix = `wamid.selected.${runId}`;
  const from = `93${String(runId).slice(-10)}`;
  const send = (position, input) => sendWhatsAppFixture(request, { id: `${prefix}.${position}`, from, ...input });

  await send(1, { text: "Hi" });
  await send(2, { command: "LANG_EN" });
  await send(3, { command: "PAY_CHALLANS" });
  await send(4, { text: "TS09CD5678" });
  const choices = await send(5, { command: "VERIFY_LOOKUP" });
  const selection = choices.responses.find((message) => message.type === "list");
  expect(selection.rows.filter((row) => row.id.startsWith("TOGGLE_PAY:"))).toHaveLength(2);

  await send(6, { command: `TOGGLE_PAY:${FLAGSHIP_CASE}` });
  await send(7, { command: "REVIEW_SELECTED" });
  const handoff = await send(8, { command: "CONFIRM_SELECTED_PAY" });
  const url = handoff.responses[0].body.match(/https?:\/\/\S+/)?.[0];
  expect(url).toBeTruthy();

  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Review 1 challan" })).toBeVisible();
  await expect(page.locator(".batch-payment-list article")).toHaveCount(1);
  await expect(page.locator(".batch-payment-total strong")).toHaveText("₹1,000");
  await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBe(390);
  await expectNoSeriousAccessibilityViolations(page);
});
