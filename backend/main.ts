/// <reference lib="deno.ns" />
import { load } from "std/dotenv";
import { handleRequest } from "./src/api/urls.ts";

// Start the server
async function startServer() {
  await load({ envPath: "./.env", export: true });

  console.log(`\n🚀 Server starting up...`);

  Deno.serve(handleRequest);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  Deno.exit(1);
});
