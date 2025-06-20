import { ServerWebSocket } from "bun";

let currentState = false;
const clients = new Set<ServerWebSocket<unknown>>();

Bun.serve({
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);
    console.log("URL received:", url);
    if (url.pathname === "/") {
      return new Response(
        ` 
        <!DOCTYPE html>
        <html>
        <body>
          <label>
            <input type="checkbox" id="checkbox" />
            Global Button
          </label>

          <script>
            const checkbox = document.getElementById("checkbox");
            const ws = new WebSocket("ws://" + location.host + "/ws");

            ws.onmessage = (event) => {
              const { state } = JSON.parse(event.data);
              checkbox.checked = state;
            };

            checkbox.addEventListener("change", () => {
              fetch("/change", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ state: checkbox.checked })
              });
            });
          </script>
        </body>
        </html>
        `,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (url.pathname === "/change" && req.method === "POST") {
      return req.json().then((body) => {
        if (typeof body.state !== "boolean") {
          return new Response("Invalid", { status: 400 });
        }

        currentState = body.state;

        // Notify all connected clients
        for (const client of clients) {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ state: currentState }));
          }
        }

        return new Response("OK");
      });
    }

    // Upgrade to WebSocket
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return; // upgrade successful
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    return new Response("Not found", { status: 404 });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log("Client connected, total:", clients.size);

      ws.send(JSON.stringify({ state: currentState }));
    },

    close(ws) {
      clients.delete(ws);
      console.log("Client disconnected, total:", clients.size);
    },

    message(ws, message) {
      // Not used, but you could allow clients to toggle state from here
      console.log("Client message:", message);
    },
  },
});

console.log("✅ Bun server running on http://localhost:3000");
