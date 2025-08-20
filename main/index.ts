import index from "./index.html";
import explanation from "./explanation.html";
const server = Bun.serve({
  routes: {
    "/": index,
    "/explanation": explanation,
  },
});
console.log(`Listening on ${server.url}`);
