/// <reference lib="deno.ns" />
import { load } from "std/dotenv";
import { handleRequest } from "./src/api/urls.ts";

// Start the server
async function startServer() {
  await load({ envPath: "./.env", export: true });

  console.log(`\n🚀 Server starting up...
🔌 API endpoints:
   - GET /api/video?id=<video_id>  (metadata)
   - GET /api/stream?id=<video_id> (video stream)
   - GET /api/videos/search?q=<term>&limit=<number>
   - GET /api/videos/recent?limit=<number>
⏳ Waiting for requests...\n`);

  Deno.serve(handleRequest);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  Deno.exit(1);
});
