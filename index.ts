import Fastify from "fastify";
import websocket from "@fastify/websocket";

let current_state = false;
const clients = new Set();

const fastify = Fastify({
  logger: false,
});

fastify.register(websocket);

fastify.get("/ws", { websocket: true }, (connection, req) => {
  console.log("WebSocket connection established");

  clients.add(connection.socket);
  console.log("Client connected, total clients:", clients.size);

  // Send initial state
  connection.socket.send(JSON.stringify({ state: current_state }));

  connection.socket.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  connection.socket.on("close", () => {
    clients.delete(connection.socket);
    console.log("Client disconnected, total clients:", clients.size);
  });

  connection.socket.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(connection.socket);
  });
});

// Cleanup stale connections
setInterval(() => {
  for (const ws of clients) {
    if (ws.readyState === 3 || ws.readyState === "closed") {
      clients.delete(ws);
      console.log(`Removed stale client. Total clients: ${clients.size}`);
    }
  }
}, 10000);

fastify.get("/", function (req, res) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fastify Button State</title>
    </head>
    <body>
      <input id="toggleBtn" type="checkbox" ${
        current_state ? "checked" : ""
      }>Toggle</input>
      <script>
        const button = document.getElementById('toggleBtn');
        const ws = new WebSocket('ws://' + location.host + '/ws');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
        };
        
        ws.onerror = (error) => {
          console.log('WebSocket error:', error);
        };
        
        ws.onmessage = (msg) => {
          console.log('Received message:', msg.data);
          const data = JSON.parse(msg.data);
          if ('state' in data) {
            button.checked = data.state;
          }
        };
        
        button.addEventListener('click', async () => {
          const newState = button.checked;
          await fetch('/change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: newState })
          });
        });
      </script>
    </body>
    </html>
  `;
  res.type("text/html").send(html);
});

fastify.post("/change", async (req, res) => {
  const { state } = req.body;
  current_state = state;
  const message = JSON.stringify({ state });

  let sentCount = 0;
  for (const ws of clients) {
    console.log("ws.readyState =", ws.readyState);
    if (ws.readyState === 1) {
      try {
        ws.send(message);
        sentCount++;
        console.log("Message sent to client");
      } catch (err) {
        console.error("Error sending message:", err);
        clients.delete(ws);
      }
    } else {
      console.log("Skipping client, readyState:", ws.readyState);
      if (ws.readyState === 3) {
        clients.delete(ws);
      }
    }
  }

  console.log(`Broadcasted new state to ${sentCount} clients`);
  return { success: true, state: current_state };
});

fastify.listen({ port: 3003 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
