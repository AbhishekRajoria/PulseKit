import { WebSocketServer } from "ws";
import { redisSub } from "./redis.ts";
import { Server } from "node:http";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  redisSub.subscribe("delivery_updates");

  redisSub.on("message", (channel, message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  return wss;
}
