import { resolve } from "node:path";
import { ChallanRepository } from "./database.js";
import { PostgresChallanRepository } from "./postgres-repository.js";

export function configuredPostgresUrl(environment = process.env) {
  return environment.CHALLAN_NYAY_DATABASE_URL || environment.DATABASE_URL || environment.POSTGRES_URL || null;
}

export function createConfiguredRepository({
  environment = process.env,
  sqlitePath = environment.CHALLAN_NYAY_DB || resolve("data", "challan-nyay.db"),
  requirePostgres = environment.CHALLAN_NYAY_REQUIRE_POSTGRES === "true",
  postgresPool,
} = {}) {
  const connectionString = configuredPostgresUrl(environment);
  if (connectionString || postgresPool) {
    return new PostgresChallanRepository({ connectionString, pool: postgresPool });
  }
  if (requirePostgres) {
    const error = new Error(
      "PostgreSQL is required but no CHALLAN_NYAY_DATABASE_URL, DATABASE_URL, or POSTGRES_URL is configured.",
    );
    error.code = "POSTGRES_CONFIGURATION_REQUIRED";
    throw error;
  }
  return new ChallanRepository(sqlitePath);
}
