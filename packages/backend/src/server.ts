import { createApp } from "./app/app";
import { env } from "./common/config/env";
import { bootstrapDatabase } from "./common/db/bootstrap";

const start = async () => {
  await bootstrapDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    process.stdout.write(`FDCDF backend listening on port ${env.PORT}\n`);
  });
};

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
