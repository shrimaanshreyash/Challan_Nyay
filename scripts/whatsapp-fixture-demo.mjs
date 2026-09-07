import { createHmac } from "node:crypto";
import { buildApp } from "../apps/api/src/app.js";
import { ChallanRepository } from "../apps/api/src/database.js";

const appSecret = process.env.CHALLAN_NYAY_WHATSAPP_APP_SECRET
  || "challan-nyay-synthetic-whatsapp-app-secret-v1";
const sender = `fixture-${Date.now()}`;
const prefix = `wamid.cli.${Date.now()}`;
const app = buildApp({
  repository: new ChallanRepository(":memory:"),
  logger: false,
  whatsappAppSecret: appSecret,
  whatsappTransport: { enabled: false, mode: "SIGNED_FIXTURE" },
});

function payload(id, input) {
  const message = input.command
    ? { id, from: sender, type: "interactive", interactive: { list_reply: { id: input.command, title: "Selected" } } }
    : { id, from: sender, type: "text", text: { body: input.text } };
  return { entry: [{ changes: [{ value: { messages: [message] } }] }] };
}

function describe(message) {
  if (message.type === "text") return message.body;
  if (message.type === "image") return `Synthetic image: ${message.link}\n${message.caption || ""}`.trim();
  if (message.type === "location") return `Approximate location: ${message.name}\n${message.latitude}, ${message.longitude}`;
  const options = (message.buttons || message.rows || [])
    .map((item) => `  - ${item.title} [${item.id}]`)
    .join("\n");
  return `${message.body}\n${options}`;
}

async function send(position, input) {
  const body = JSON.stringify(payload(`${prefix}.${position}`, input));
  const signature = `sha256=${createHmac("sha256", appSecret).update(body).digest("hex")}`;
  const response = await app.inject({
    method: "POST",
    url: "/api/channels/whatsapp/webhook",
    headers: { "content-type": "application/json", "x-hub-signature-256": signature },
    payload: body,
  });
  const result = response.json();
  if (response.statusCode >= 400) throw new Error(`${result.code || response.statusCode}: ${result.message || "fixture failed"}`);
  console.log(`\nUSER  ${input.command || input.text}`);
  for (const message of result.responses || []) console.log(`SERVICE\n${describe(message)}`);
  return result;
}

console.log("Challan Nyay WhatsApp signed-fixture walkthrough");
console.log("Local contract only — this does not send a live WhatsApp message.");

await send(1, { text: "Hi" });
await send(2, { command: "LANG_EN" });
await send(3, { command: "CHECK_CHALLAN" });
await send(4, { text: "TS09CD5678" });
await send(5, { command: "VERIFY_LOOKUP" });
await send(6, { command: "VIEW_CHALLANS" });
await send(7, { command: "CASE:CN-DEMO-WRONG-VEHICLE" });
await send(8, { command: "TRACK:CN-DEMO-WRONG-VEHICLE" });
await app.close();
