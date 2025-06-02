import { initJellyfinClient } from "./jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import {
  handleVideoById,
  handleVideoDetails,
  handleVideoSearch,
} from "../controllers/videoController.ts";
import { handleLogin } from "../controllers/authController.ts";
import {
  handleGetVideoSegment,
  handleHlsMainPlaylist,
  handleHlsMasterPlaylist,
} from "../controllers/hlsController.ts";

let jellyfin: Awaited<ReturnType<typeof initJellyfinClient>>;

// Initialize the Jellyfin client
async function init() {
  try {
    jellyfin = await initJellyfinClient();
    console.log("✅ Jellyfin client initialized successfully");
  } catch (error: any) {
    console.error("❌ Failed to initialize Jellyfin client:", error.message);
    Deno.exit(1);
  }
}

// Function to ensure Jellyfin client is initialized
async function getJellyfinClient() {
  if (!jellyfin) {
    await init();
  }
  return jellyfin;
}


export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Handle OPTIONS requests for CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: addCorsHeaders(),
    });
  }

  try {
    const client = await getJellyfinClient();

    // hls stream routes
    if (url.pathname.startsWith("/api/master-hls-playlist/")) {
      const pathParts = url.pathname.split("/");
      const videoId = pathParts[3]; // Get the video ID from the path
      if (videoId) {
        return await handleHlsMasterPlaylist(client, videoId);
      }
    }

    if (url.pathname.startsWith("/api/main.m3u8")) {
      const mediaSourceId = url.searchParams.get("mediaSourceId");

      if (mediaSourceId) {
        return await handleHlsMainPlaylist(client, mediaSourceId);
      }
    }

    if (url.pathname.startsWith("/api/video-segment/hls1/main/")) {
      const pathParts = url.pathname.split("/");
      const playlistId = pathParts[3];
      const file = pathParts[5];
      const [segmentId, container] = file.split(".");

      const itemId = url.searchParams.get("mediaSourceId");
      const runtimeTicks = url.searchParams.get("runtimeTicks");
      const actualSegmentLengthTicks = url.searchParams.get(
        "actualSegmentLengthTicks",
      );

      if (
        itemId &&
        runtimeTicks &&
        actualSegmentLengthTicks &&
        segmentId &&
        container
      ) {
        return await handleGetVideoSegment(
          client,
          req,
          itemId,
          playlistId,
          segmentId,
          container,
          runtimeTicks,
          actualSegmentLengthTicks,
        );
      }
    }

    // Video routes
    if (url.pathname === "/api/video-search") {
      return await handleVideoSearch(client, req);
    }

    if (url.pathname === "/api/video" && url.searchParams.has("id")) {
      return await handleVideoById(client, url.searchParams.get("id")!);
    }

    if (url.pathname.startsWith("/api/video-details/")) {
      const videoId = url.pathname.split("/").pop();
      if (videoId) {
        return await handleVideoDetails(client, req, videoId);
      }
    }

    // Auth routes
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      return await handleLogin(client, req);
    }

    // Not found
    console.log(`⚠️ Not found: ${req.method} ${url.pathname}`);
    return new Response("Not Found", {
      status: 404,
      headers: addCorsHeaders(),
    });
  } catch (error: any) {
    console.error(`❌ Unhandled error: ${error.message}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: addCorsHeaders(
        new Headers({
          "Content-Type": "application/json",
        }),
      ),
    });
  }
}
