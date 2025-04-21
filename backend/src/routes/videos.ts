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

// Function to ensure Jellyfin client is initialized
async function getJellyfinClient(): Promise<JellyfinClient> {
  if (!jellyfinClient) {
    await init();
  }
  return jellyfinClient;
}

// Helper function to add CORS headers
function addCorsHeaders(headers: Headers = new Headers()): Headers {
  if (Deno.env.get("CORS") === 'true') {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
  }
  return headers;
}

// Handle video search requests
export async function handleVideoSearch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  try {
    const client = await getJellyfinClient();
    const videos = await client.searchVideos(query || undefined, limit);
    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error('Error searching videos:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to search videos' }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

// Handle video by ID requests
export async function handleVideoById(req: Request, id: string): Promise<Response> {
  try {
    const client = await getJellyfinClient();
    const video = await client.getVideoById(id);
    
    return new Response(JSON.stringify(video), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error('Error fetching video:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch video' }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
} 