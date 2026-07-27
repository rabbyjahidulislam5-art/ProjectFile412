import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./lib/prisma";
import { attachRealtimeGateway, closeRealtimeGateway } from "./realtime/gateway";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Smart Campus API listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

attachRealtimeGateway(server);

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  closeRealtimeGateway();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
