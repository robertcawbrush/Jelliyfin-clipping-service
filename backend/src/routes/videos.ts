import { JellyfinClient } from '../api/jellyfin.ts';
import { initJellyfinClient } from '../api/jellyfin.ts';

// Initialize Jellyfin client with environment variables
let jellyfinClient: JellyfinClient;

// Initialize the Jellyfin client
async function init() {
  try {
    jellyfinClient = await initJellyfinClient();
    console.log("✅ Jellyfin client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Jellyfin client:", error.message);
    Deno.exit(1);
  }
}