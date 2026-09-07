import { buildApp } from "./app.js";
import { createConfiguredRepository } from "./repository-factory.js";

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const app = buildApp({ repository: createConfiguredRepository() });

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
