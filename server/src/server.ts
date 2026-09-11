import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { initSocket } from './realtime/socket';
import { startOverdueWatcher } from './jobs/overdueWatcher';
import { prisma } from './config/prisma';

const app = createApp();
const server = http.createServer(app);

// Initialize real-time WebSocket layer
initSocket(server);

// Start background cron scheduler for overdue tasks
startOverdueWatcher();

server.listen(config.port, '0.0.0.0', () => {
  console.log(`[Server] Velozity API service running on port ${config.port} (${config.nodeEnv})`);
  console.log(`[Socket] WebSocket server mounted`);
  console.log(`[Cron] Overdue task scheduler activated`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP and WebSocket connections closed.');
    await prisma.$disconnect();
    console.log('[Prisma] Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
