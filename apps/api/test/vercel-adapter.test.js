import assert from "node:assert/strict";
import test from "node:test";
import { app, restoreForwardedApiPath } from "../../../api/index.js";
import { buildApp } from "../src/app.js";
import { ChallanRepository } from "../src/database.js";

test("Vercel gateway restores the original nested API path", async (t) => {
  t.after(async () => app.close());

  const request = {
    url: "/api/index?path=lookup%2Fchallenge&source=production-check",
  };

  assert.equal(
    restoreForwardedApiPath(request),
    "/api/lookup/challenge?source=production-check",
  );

  await app.ready();
  const session = await app.inject({ method: "POST", url: "/api/demo/sessions", payload: {} });
  const response = await app.inject({
    method: "GET",
    url: request.url,
    headers: { authorization: `Bearer ${session.json().token}` },
  });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /application\/json/);
  assert.match(response.json().challenge.prompt, /^\d+ \+ \d+$/);
});

test("serverless readiness does not wait for a slow repository warmup", async (t) => {
  const repository = new ChallanRepository(":memory:");
  let initializeCalled = false;
  repository.initialize = async () => {
    initializeCalled = true;
    await new Promise(() => {});
  };

  const serverlessApp = buildApp({
    repository,
    logger: false,
    initializeRepositoryOnReady: false,
  });
  t.after(async () => serverlessApp.close());

  await serverlessApp.ready();
  const response = await serverlessApp.inject({ method: "GET", url: "/api/health" });

  assert.equal(response.statusCode, 200);
  assert.equal(initializeCalled, false);
});
