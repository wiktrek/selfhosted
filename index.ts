import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { WebSocket } from "ws";

const fastify = Fastify();
let current_state = false;

const clients = new Set<WebSocket>();

fastify.register(websocket);

fastify.get("/", async (req, res) => {
  res.type("text/html").send(`
    <!DOCTYPE html>
    <html>
    <body>
      <label>
        <input type="checkbox" id="checkbox" />
        Global Button
      </label>

      <script>
        const checkbox = document.getElementById("checkbox");
        const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws");

        ws.onmessage = (msg) => {
          const { state } = JSON.parse(msg.data);
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
  `);
});

fastify.post("/change", async (req, res) => {
  const body = (await req.body) as { state: boolean };
  if (typeof body.state !== "boolean") {
    return res.status(400).send("Invalid");
  }

  current_state = body.state;

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ state: current_state }));
    }
  }

  res.send("OK");
});

fastify.get("/ws", { websocket: true }, (connection, req) => {
  const socket = connection.socket as WebSocket;

  clients.add(socket);
  console.log("Client connected. Total clients:", clients.size);

  socket.send(JSON.stringify({ state: current_state }));

  socket.on("close", () => {
    clients.delete(socket);
    console.log("Client disconnected. Total clients:", clients.size);
  });
});

fastify.listen({ port: 3000 }, () => {
  console.log("Server running at http://localhost:3000");
});
