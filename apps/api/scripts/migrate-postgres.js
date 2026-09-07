import { createConfiguredRepository } from "../src/repository-factory.js";

const repository = createConfiguredRepository({ requirePostgres: true });

try {
  await repository.initialize();
  process.stdout.write("Challan Nyay PostgreSQL migrations are up to date.\n");
} finally {
  await repository.close();
}
