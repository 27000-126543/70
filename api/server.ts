import app from './app.js';
import { wsService } from './services/ws.js';
import { scheduler } from './services/scheduler.js';
import type { Server as HTTPServer } from 'http';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`[Server] GRMHD Backend ready on port ${PORT}`);
  console.log(`[Server] REST API: http://localhost:${PORT}/api`);
  console.log(`[Server] WebSocket: ws://localhost:${PORT}/ws`);

  wsService.attach(server as HTTPServer);
  scheduler.start();

  console.log(`[Server] All services initialized successfully`);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM signal received');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT signal received');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

export default app;
