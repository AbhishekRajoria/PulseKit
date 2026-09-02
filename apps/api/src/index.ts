import http from "node:http";
import app from "./app.ts";
import { setupWebSocket } from "./lib/websocket.ts";

const server = http.createServer(app);
setupWebSocket(server);

server.listen(8080, () => {
  console.log("Server running on port 8080");
});
