import Fastify from "fastify";
import websocket from "@fastify/websocket";

let current_state = false;
const clients = new Set();

const fastify = Fastify({
  logger: false,
});

fastify.register(websocket);

fastify.get("/", function (req, res) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Global button</title>
    </head>
    <body>
        <input type="checkbox" id="checkbox" checked=${current_state}>Global button</input>
        <script>
            const checkbox = document.getElementById("checkbox")
            checkbox.addEventListener("click", () => {
                console.log(checkbox.checked)
            fetch("/change", {
                method: "POST",
                body: JSON.stringify({
                    state: checkbox.checked    
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
                })
                .then((response) => console.log(response))
            })
            
        </script>
    </body>
    </html>
  `;
  res.type("text/html").send(html);
});
fastify.post("/change", (req, res) => {
  const { state } = req.body;
  current_state = state;
  console.log(current_state);
  res.status(200).send("OK");
});
fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
