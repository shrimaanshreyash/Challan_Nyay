import { resolve } from "node:path";
import { buildApp } from "./app.js";
import { ChallanRepository } from "./database.js";

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const databasePath = process.env.CHALLAN_NYAY_DB || resolve("data", "challan-nyay.db");
const app = buildApp({ repository: new ChallanRepository(databasePath) });

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

