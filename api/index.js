import { buildApp } from "../apps/api/src/app.js";
import { ChallanRepository } from "../apps/api/src/database.js";

// Vercel functions have ephemeral filesystems, so the public demo keeps its
// synthetic state in memory. A cold start safely returns to the documented
// seed cases.
const repository = new ChallanRepository(":memory:");
const app = buildApp({ repository, logger: true });
const ready = app.ready();

export function restoreForwardedApiPath(request) {
  const incoming = new URL(request.url || "/api/index", "http://localhost");
  const forwardedPath = incoming.searchParams.get("path");
  if (!forwardedPath) return request.url;

  incoming.searchParams.delete("path");
  const apiPath = forwardedPath.replace(/^\/+/, "");
  const remainingQuery = incoming.searchParams.toString();
  request.url = `/api/${apiPath}${remainingQuery ? `?${remainingQuery}` : ""}`;
  return request.url;
}

export { app };

export default async function handler(request, response) {
  restoreForwardedApiPath(request);
  await ready;
  app.server.emit("request", request, response);
}
