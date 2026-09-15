import http from "node:http";
import app from "./app.ts";
import { setupWebSocket } from "./lib/websocket.ts";

const PORT = process.env.PORT ?? 8080;

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
