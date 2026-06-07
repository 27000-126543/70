import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { WSMessage, WSMessageType } from '../types.js';

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  attach(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('[WS] Client connected, total:', this.clients.size);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[WS] Client disconnected, total:', this.clients.size);
      });

      ws.on('error', (err) => {
        console.error('[WS] Client error:', err.message);
      });

      this.send(ws, {
        type: 'stats:updated',
        timestamp: Date.now(),
        payload: { message: 'Connected to GRMHD simulation backend' },
      });
    });

    console.log('[WS] WebSocket server attached on /ws');
  }

  broadcast(type: WSMessageType, payload: any) {
    const msg: WSMessage = { type, timestamp: Date.now(), payload };
    const data = JSON.stringify(msg);
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  send(ws: WebSocket, msg: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
