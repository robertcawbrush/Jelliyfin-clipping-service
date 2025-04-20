// use this to setup the URLS

import { Video } from "./models.ts";
import { addVideo, getVideoByJellyfinId, createClip, getClipsByUserId, getClipById, deleteClip } from "../db/index.ts";
import { JellyfinClient, initJellyfinClient } from "./jellyfin.ts";

let jellyfin: JellyfinClient;

// Initialize the Jellyfin client
async function init() {
  try {
    jellyfin = await initJellyfinClient();
    console.log("✅ Jellyfin client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Jellyfin client:", error.message);
    Deno.exit(1);
  }
}

// Function to ensure Jellyfin client is initialized
async function getJellyfinClient(): Promise<JellyfinClient> {
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

// Add CORS headers helper function
function addCorsHeaders(headers: Headers = new Headers()): Headers {
  if (Deno.env.get("CORS") === 'true') {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MediaBrowser-Token');
    headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  return headers;
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

  if (url.pathname === '/api/video' && url.searchParams.has('id')) {
    console.log(`📝 GET ${url.pathname}`);
    
    try {
      const videoId = url.searchParams.get('id')!;
      const video = await getVideoById(videoId);
      
      console.log(`✅ Successfully served video metadata: ${video.name}`);
      return new Response(JSON.stringify(video), {
        status: 200,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    } catch (error) {
      console.error(`❌ Error serving video metadata: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }
  
  if (url.pathname === '/api/stream' && url.searchParams.has('id')) {
    console.log(`🎬 GET ${url.pathname}`);
    
    try {
      const videoId = url.searchParams.get('id')!;
      const response = await streamVideo(req, videoId);
      const headers = addCorsHeaders(new Headers(response.headers));
      return new Response(response.body, {
        status: response.status,
        headers
      });
    } catch (error) {
      console.error(`❌ Error starting stream: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }

  if (url.pathname === '/api/videos/search') {
    console.log(`🔍 GET ${url.pathname}`);
    
    try {
      const searchTerm = url.searchParams.get('q') || '';
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      const client = await getJellyfinClient();
      const results = await client.searchVideos(searchTerm, limit);
      
      console.log(`✅ Found ${results.Items.length} videos matching "${searchTerm}"`);
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    } catch (error: any) {
      console.error(`❌ Error searching videos: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    console.log(`🔐 POST ${url.pathname}`);
    
    try {
      const { username, password } = await req.json();
      
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), {
          status: 400,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      const client = await getJellyfinClient();
      const authResult = await client.authenticate(username, password);
      
      console.log(`✅ User authenticated successfully`);
      return new Response(JSON.stringify(authResult), {
        status: 200,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    } catch (error: any) {
      console.error(`❌ Authentication failed: ${error.message}`);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }

  if (url.pathname === '/api/clips' && req.method === 'GET') {
    console.log(`📋 GET ${url.pathname}`);
    
    try {
      const userId = req.headers.get('X-User-Id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 401,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      const clips = await getClipsByUserId(userId);
      console.log(`✅ Found ${clips.length} clips for user ${userId}`);
      
      return new Response(JSON.stringify(clips), {
        status: 200,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    } catch (error: any) {
      console.error(`❌ Error fetching clips: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }

  if (url.pathname === '/api/clips' && req.method === 'POST') {
    console.log(`📝 POST ${url.pathname}`);
    
    try {
      const userId = req.headers.get('X-User-Id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 401,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      const { videoId, title, description, startTime, endTime } = await req.json();
      
      if (!videoId || !title || !startTime || !endTime) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      const clip = await createClip({
        userId,
        videoId,
        title,
        description,
        startTime,
        endTime,
        status: 'pending'
      });

      console.log(`✅ Created clip: ${clip.title}`);
      return new Response(JSON.stringify(clip), {
        status: 201,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    } catch (error: any) {
      console.error(`❌ Error creating clip: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }

  if (url.pathname.startsWith('/api/clips/') && req.method === 'DELETE') {
    console.log(`🗑️ DELETE ${url.pathname}`);
    
    try {
      const userId = req.headers.get('X-User-Id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 401,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      const clipId = parseInt(url.pathname.split('/').pop()!);
      const clip = await getClipById(clipId);

      if (!clip) {
        return new Response(JSON.stringify({ error: 'Clip not found' }), {
          status: 404,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      if (clip.userId !== userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }

      await deleteClip(clipId);
      console.log(`✅ Deleted clip: ${clip.title}`);
      
      return new Response(null, {
        status: 204,
        headers: addCorsHeaders()
      });
    } catch (error: any) {
      console.error(`❌ Error deleting clip: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }
  }

  console.log(`⚠️ Not found: ${req.method} ${url.pathname}`);
  return new Response("Not Found", { 
    status: 404,
    headers: addCorsHeaders()
  });
}