import { ServerWebSocket } from "bun";
import index from "./index.html";
let currentState = false;
const clients = new Set<ServerWebSocket<unknown>>();

Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/change":{
      POST: async req => {
        return req.json().then((body) => {
          if (typeof body.state !== "boolean") {
            return new Response("Invalid", { status: 400 });
          }
        currentState = body.state;
        for (const client of clients) {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ state: currentState }));
          }
        }

        return new Response("OK");
      });
      }
    },
    "/ws": (req,server) => {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

  },
  fetch(req, server) {
    const url = new URL(req.url);
    return new Response("Not found", { status: 404 });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      ws.send(JSON.stringify({ state: currentState }));
    },

    close(ws) {
      clients.delete(ws);
    },

    message(ws, message) {
    },
  },
});

console.log("✅ Bun server running on http://localhost:3000");
