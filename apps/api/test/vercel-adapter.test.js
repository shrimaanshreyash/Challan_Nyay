import assert from "node:assert/strict";
import test from "node:test";
import { app, restoreForwardedApiPath } from "../../../api/index.js";

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
  const response = await app.inject({ method: "GET", url: request.url });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /application\/json/);
  assert.match(response.json().challenge.prompt, /^\d+ \+ \d+$/);
});
