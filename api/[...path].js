import { buildApp } from "../apps/api/src/app.js";
import { ChallanRepository } from "../apps/api/src/database.js";

// Vercel functions have ephemeral filesystems, so the public preview keeps its
// synthetic demo state in memory. A warm function instance preserves a user's
// journey; a new instance safely starts again from the documented seed cases.
const repository = new ChallanRepository(":memory:");
const app = buildApp({ repository, logger: true });
const ready = app.ready();

export { app };

export default async function handler(request, response) {
  await ready;
  app.server.emit("request", request, response);
}
