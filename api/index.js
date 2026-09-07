import { buildApp } from "../apps/api/src/app.js";
import { createConfiguredRepository } from "../apps/api/src/repository-factory.js";

// Deployed functions must use managed PostgreSQL. The in-memory SQLite fallback
// remains available only for local adapter tests where VERCEL is not set.
const repository = createConfiguredRepository({
  sqlitePath: ":memory:",
  requirePostgres: process.env.VERCEL === "1" || process.env.CHALLAN_NYAY_REQUIRE_POSTGRES === "true",
});
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
