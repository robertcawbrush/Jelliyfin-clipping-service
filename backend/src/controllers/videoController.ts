import { Video } from "../api/models.ts";
import { addVideo, getVideoByJellyfinId } from "../db/index.ts";
import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";

export async function handleVideoSearch(client: JellyfinClient, req: Request): Promise<Response> {
  console.log(`🔍 GET /api/videos/search`);
  
  try {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    const results = await client.searchVideos(searchTerm || undefined, limit);
    
    console.log(`✅ Found ${results.Items.length} videos${searchTerm ? ` matching "${searchTerm}"` : ''}`);
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

export async function handleVideoById(client: JellyfinClient, videoId: string): Promise<Response> {
  console.log(`📝 GET /api/video/${videoId}`);
  
  try {
    const video = await getVideoMetadata(client, videoId);
    
    console.log(`✅ Successfully served video metadata: ${video.name}`);
    return new Response(JSON.stringify(video), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Error serving video metadata: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

export async function handleVideoStream(client: JellyfinClient, req: Request, videoId: string): Promise<Response> {
  console.log(`🎬 GET /api/stream/${videoId}`);
  
  try {
    const range = req.headers.get('range');
    const streamUrl = `${client['baseUrl']}/Videos/${videoId}/stream`;
    
    const streamResponse = await fetch(streamUrl, {
      headers: {
        'X-MediaBrowser-Token': client['apiKey'],
        ...(range ? { 'Range': range } : {}),
      }
    });
    
    if (!streamResponse.ok) {
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
    
    addCorsHeaders(headers);
    
    const { readable, writable } = new TransformStream();
    streamResponse.body?.pipeTo(writable);
    
    return new Response(readable, {
      status: streamResponse.status,
      headers
    });
  } catch (error: any) {
    console.error(`❌ Error streaming video: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

export async function handleVideoDetails(client: JellyfinClient, req: Request, videoId: string): Promise<Response> {
  console.log(`📝 GET /api/video-details/${videoId}`);
  
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

    // Call Jellyfin API to get video details
    const response = await fetch(`${client['baseUrl']}/Users/${userId}/Items/${videoId}`, {
      headers: {
        'X-MediaBrowser-Token': client['apiKey']
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video details: ${response.statusText}`);
    }
    
    const videoData = await response.json();
    console.log(`✅ Successfully fetched video details: ${videoData.Name}`);
    
    return new Response(JSON.stringify(videoData), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Error fetching video details: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

// Helper function to get video metadata
async function getVideoMetadata(client: JellyfinClient, id: string): Promise<Video> {
  console.log(`🔍 Fetching video: ${id}`);
  
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
    videoCodec: video.MediaStreams?.find((s: any) => s.Type === 'Video')?.Codec || null,
    audioCodec: video.MediaStreams?.find((s: any) => s.Type === 'Audio')?.Codec || null
  });

  console.log(`💾 Cached video metadata`);
  return newVideo;
} 