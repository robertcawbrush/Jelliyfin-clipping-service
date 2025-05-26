import { Video } from "./models.ts";
import { addVideo, getVideoByJellyfinId } from "../db/index.ts";
import { initJellyfinClient } from "./jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import {
  handleVideoById,
  handleVideoDetails,
  handleVideoSearch,
} from "../controllers/videoController.ts";
import { handleLogin } from "../controllers/authController.ts";
import {
  handleCreateClip,
  handleDeleteClip,
  handleGetClips,
} from "../controllers/clipController.ts";
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

async function getVideoById(id: string): Promise<Video> {
  console.log(`🔍 Fetching video: ${id}`);

  const client = await getJellyfinClient();

  const localVideo = await getVideoByJellyfinId(id);
  if (localVideo) {
    console.log(`✅ Found video in cache: ${localVideo.name}`);
    return localVideo;
  }

  const response = await fetch(`${client["baseUrl"]}/Items/${id}`, {
    headers: {
      "X-MediaBrowser-Token": client["apiKey"],
    },
  });

  if (!response.ok) {
    console.error(`❌ Failed to fetch video: ${response.statusText}`);
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }

  const video = await response.json();
  console.log(`✅ Found video in Jellyfin: ${video.Name}`);

  const newVideo = await addVideo({
    jellyfinId: id,
    name: video.Name,
    path: video.Path,
    type: video.Type,
    duration: video.RunTimeTicks
      ? Math.floor(video.RunTimeTicks / 10000000)
      : null,
    size: video.Size || null,
    container: video.Container || null,
    videoCodec: video.MediaStreams?.find((s: { Type: string }) =>
      s.Type === "Video"
    )?.Codec || null,
    audioCodec: video.MediaStreams?.find((s: { Type: string }) =>
      s.Type === "Audio"
    )?.Codec || null,
  });

  console.log(`💾 Cached video metadata`);
  return newVideo;
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
        return await handleHlsMasterPlaylist(client, req, videoId);
      }
    }

    if (url.pathname.startsWith("/api/main.m3u8")) {
      const mediaSourceId = url.searchParams.get("mediaSourceId");

      if (mediaSourceId) {
        return await handleHlsMainPlaylist(client, req, mediaSourceId);
      }
    }

    if (url.pathname.startsWith("/api/video-segment/hls1/main/")) {
      const pathParts = url.pathname.split("/");
      const playlistId = pathParts[3];
      const file = pathParts[5];
      const [segmentId, container] = file.split(".");

      const mediaSourceId = url.searchParams.get("mediaSourceId");
      const runtimeTicks = url.searchParams.get("runtimeTicks");
      const actualSegmentLengthTicks = url.searchParams.get(
        "actualSegmentLengthTicks",
      );

      if (
        mediaSourceId &&
        runtimeTicks &&
        actualSegmentLengthTicks &&
        segmentId &&
        container
      ) {
        return await handleGetVideoSegment(
          client,
          req,
          mediaSourceId,
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

    // Clips routes
    if (url.pathname === "/api/clips") {
      if (req.method === "GET") {
        return await handleGetClips(req);
      }
      if (req.method === "POST") {
        return await handleCreateClip(req);
      }
    }

    if (url.pathname.startsWith("/api/clips/") && req.method === "DELETE") {
      const clipId = parseInt(url.pathname.split("/").pop()!);
      return await handleDeleteClip(req, clipId);
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
