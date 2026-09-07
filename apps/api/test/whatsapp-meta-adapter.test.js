import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMetaWhatsAppTransport,
  toMetaOutboundPayload,
  toMetaOutboundPayloads,
} from "../src/whatsapp-meta-adapter.js";

test("Meta adapter converts normalized text, buttons and lists without changing command ids", () => {
  const messages = [
    { type: "text", body: "Synthetic fixture message" },
    {
      type: "buttons",
      body: "Confirm this safe handoff?",
      buttons: [["unused"]].map(() => ({ id: "CONFIRM_PAY:CN-DEMO", title: "Continue on web" })),
    },
    {
      type: "list",
      body: "Choose a challan",
      button: "View challans",
      rows: [{ id: "CASE:CN-DEMO", title: "TS09CD5678 · ₹1,000", description: "Action required · Helmet" }],
    },
  ];
  const payloads = toMetaOutboundPayloads("919999999999", messages);
  assert.equal(payloads[0].type, "text");
  assert.equal(payloads[0].text.preview_url, false);
  assert.equal(payloads[1].interactive.action.buttons[0].reply.id, "CONFIRM_PAY:CN-DEMO");
  assert.equal(payloads[2].interactive.action.sections[0].rows[0].id, "CASE:CN-DEMO");
  assert.ok(payloads.every((payload) => payload.messaging_product === "whatsapp"));
});

test("Meta adapter enforces platform-safe interactive limits and rejects unknown message types", () => {
  const payload = toMetaOutboundPayload("919999999999", {
    type: "buttons",
    body: "A".repeat(1200),
    buttons: [
      { id: "ONE", title: "One" },
      { id: "TWO", title: "Two" },
      { id: "THREE", title: "Three" },
      { id: "FOUR", title: "Four" },
    ],
  });
  assert.equal(payload.interactive.body.text.length, 1024);
  assert.equal(payload.interactive.action.buttons.length, 3);
  assert.throws(
    () => toMetaOutboundPayload("919999999999", { type: "video" }),
    (error) => error.code === "UNSUPPORTED_CHANNEL_MESSAGE",
  );
});

test("Meta adapter emits bounded evidence images and approximate locations", () => {
  const evidence = toMetaOutboundPayload("919999999999", {
    type: "image",
    link: "https://example.invalid/assets/evidence.webp",
    caption: "Synthetic evidence",
  });
  assert.equal(evidence.type, "image");
  assert.equal(evidence.image.link, "https://example.invalid/assets/evidence.webp");

  const location = toMetaOutboundPayload("919999999999", {
    type: "location",
    latitude: 17.36887,
    longitude: 78.52562,
    name: "Dilsukhnagar Check Post",
    address: "Approximate synthetic location",
  });
  assert.equal(location.type, "location");
  assert.equal(location.location.latitude, 17.36887);
  assert.throws(
    () => toMetaOutboundPayload("919999999999", { type: "location", latitude: 900, longitude: 78 }),
    (error) => error.code === "INVALID_CHANNEL_LOCATION",
  );
});

test("Meta transport authenticates a Cloud API send and returns its provider message id", async () => {
  let captured;
  const transport = createMetaWhatsAppTransport({
    accessToken: "test-access-token",
    phoneNumberId: "123456789",
    apiVersion: "v23.0",
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, status: 200, json: async () => ({ messages: [{ id: "wamid.outbound.1" }] }) };
    },
  });
  const result = await transport.send("919999999999", { type: "text", body: "Hello" });
  assert.equal(result.providerMessageId, "wamid.outbound.1");
  assert.match(captured.url, /v23\.0\/123456789\/messages$/);
  assert.equal(captured.options.headers.authorization, "Bearer test-access-token");
  assert.equal(JSON.parse(captured.options.body).to, "919999999999");
});

test("Meta transport classifies rate limits as retryable without exposing provider bodies", async () => {
  const transport = createMetaWhatsAppTransport({
    accessToken: "test-access-token",
    phoneNumberId: "123456789",
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: 4, message: "Provider-only diagnostic" } }),
    }),
  });
  await assert.rejects(
    () => transport.send("919999999999", { type: "text", body: "Hello" }),
    (error) => error.code === "META_4" && error.retryable === true && !error.message.includes("Provider-only"),
  );
});

test("Meta transport retries one transient network failure before succeeding", async () => {
  let attempts = 0;
  const transport = createMetaWhatsAppTransport({
    accessToken: "test-access-token",
    phoneNumberId: "123456789",
    requestTimeoutMs: 50,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error("temporary timeout"), { name: "TimeoutError" });
      return { ok: true, status: 200, json: async () => ({ messages: [{ id: "wamid.outbound.retry" }] }) };
    },
  });

  const result = await transport.send("919999999999", { type: "text", body: "Hello" });
  assert.equal(result.providerMessageId, "wamid.outbound.retry");
  assert.equal(attempts, 2);
});

test("Meta transport reports an explicit timeout after bounded network retries", async () => {
  let attempts = 0;
  const transport = createMetaWhatsAppTransport({
    accessToken: "test-access-token",
    phoneNumberId: "123456789",
    requestTimeoutMs: 50,
    fetchImpl: async () => {
      attempts += 1;
      throw Object.assign(new Error("provider timeout"), { name: "TimeoutError" });
    },
  });

  await assert.rejects(
    () => transport.send("919999999999", { type: "text", body: "Hello" }),
    (error) => error.code === "META_NETWORK_TIMEOUT" && error.retryable === true,
  );
  assert.equal(attempts, 2);
});
