// use this to setup the URLS

import { Video } from "./models.ts";
import { addVideo, getVideoByJellyfinId, createClip, getClipsByUserId, getClipById, deleteClip } from "../db/index.ts";
import { JellyfinClient, initJellyfinClient } from "./jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import { handleVideoSearch, handleVideoById, handleVideoStream } from "../controllers/videoController.ts";
import { handleLogin } from "../controllers/authController.ts";
import { handleGetClips, handleCreateClip, handleDeleteClip } from "../controllers/clipController.ts";

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
  
  const response = await fetch(`${client['baseUrl']}/Items/${id}`, {
    headers: {
      'X-MediaBrowser-Token': client['apiKey']
    }
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
    duration: video.RunTimeTicks ? Math.floor(video.RunTimeTicks / 10000000) : null,
    size: video.Size || null,
    container: video.Container || null,
    videoCodec: video.MediaStreams?.find(s => s.Type === 'Video')?.Codec || null,
    audioCodec: video.MediaStreams?.find(s => s.Type === 'Audio')?.Codec || null
  });

  console.log(`💾 Cached video metadata`);
  return newVideo;
}

async function streamVideo(req: Request, videoId: string): Promise<Response> {
  console.log(`🎬 Starting video stream: ${videoId}`);
  
  const client = await getJellyfinClient();
  const range = req.headers.get('range');
  const streamUrl = `${client['baseUrl']}/Videos/${videoId}/stream`;
  
  const streamResponse = await fetch(streamUrl, {
    headers: {
      'X-MediaBrowser-Token': client['apiKey'],
      ...(range ? { 'Range': range } : {}),
    }
  });
  
  if (!streamResponse.ok) {
    console.error(`❌ Failed to stream video: ${streamResponse.statusText}`);
    throw new Error(`Failed to stream video: ${streamResponse.statusText}`);
  }
  
  console.log(`✅ Stream established`);
  
  const headers = new Headers();
  [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
  ].forEach(header => {
    const value = streamResponse.headers.get(header);
    if (value) headers.set(header, value);
  });
  
  if (Deno.env.get("CORS") === 'true') {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
  }
  
  const { readable, writable } = new TransformStream();
  streamResponse.body?.pipeTo(writable);
  
  return new Response(readable, {
    status: streamResponse.status,
    headers
  });
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: addCorsHeaders()
    });
  }

  try {
    const client = await getJellyfinClient();

    // Video routes
    if (url.pathname === '/api/video-search') {
      return await handleVideoSearch(client, req);
    }

    if (url.pathname === '/api/video' && url.searchParams.has('id')) {
      return await handleVideoById(client, url.searchParams.get('id')!);
    }

    if (url.pathname === '/api/stream' && url.searchParams.has('id')) {
      return await handleVideoStream(client, req, url.searchParams.get('id')!);
    }

    // Auth routes
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      return await handleLogin(client, req);
    }

    // Clips routes
    if (url.pathname === '/api/clips') {
      if (req.method === 'GET') {
        return await handleGetClips(req);
      }
      if (req.method === 'POST') {
        return await handleCreateClip(req);
      }
    }

    if (url.pathname.startsWith('/api/clips/') && req.method === 'DELETE') {
      const clipId = parseInt(url.pathname.split('/').pop()!);
      return await handleDeleteClip(req, clipId);
    }

    // Not found
    console.log(`⚠️ Not found: ${req.method} ${url.pathname}`);
    return new Response("Not Found", { 
      status: 404,
      headers: addCorsHeaders()
    });

  } catch (error: any) {
    console.error(`❌ Unhandled error: ${error.message}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}