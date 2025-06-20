import index from "./index.html";
const server = Bun.serve({
  routes: {
    "/": index,
  },
});
console.log(`Listening on ${server.url}`);
