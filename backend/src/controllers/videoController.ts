import { Video } from "../api/models.ts";
import { addVideo, getVideoByJellyfinId } from "../db/index.ts";
import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api.js";

export async function handleVideoSearch(client: JellyfinClient, req: Request): Promise<Response> {
  console.log(`🔍 GET /api/videos/search`);
  
  try {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('query');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    console.log(`🔍 Search parameters: term="${searchTerm}", limit=${limit}`);
    
    // Get the shared API instance from the client
    const api = client.getSdkApi();
    console.log(`🔑 API instance created, checking headers:`, api.configuration.headers);
    
    // Create the search parameters
    const searchParams = {
      searchTerm: searchTerm || undefined,
      includeItemTypes: ['Movie', 'Episode', 'Video'],
      recursive: true,
      limit: limit,
      fields: ['Path', 'Overview', 'MediaSources', 'MediaStreams'],
      enableImages: true,
      imageTypeLimit: 1,
      sortBy: ['Name'],
      sortOrder: ['Ascending']
    };
    
    console.log(`🔍 Search parameters:`, searchParams);
    
    // Use the SDK to search for videos
    console.log(`🔍 Sending search request to Jellyfin...`);
    // const response = await api.items.getItems(searchParams);

    // const response = getItemsApi(api);
    
    // Use the SDK to get video details
    const response = await getItemsApi(api).getItems(searchParams)

    
    // Check if Items exists in the response
    if (!response.data.Items) {
      console.error(`❌ No items found in the response`);
      throw new Error('No items found in the response');
    }
    
    console.log(`✅ Found ${response.data.Items.length} videos${searchTerm ? ` matching "${searchTerm}"` : ''}`);
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Error searching videos: ${error.message}`);
    console.error(`❌ Error details:`, error);
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
  console.log(`🔍 Request URL: ${req.url}`);
  
  try {
    // Extract segment information from the URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const segmentPath = pathParts[pathParts.length - 1];
    console.log(`📁 Path parts:`, pathParts);
    console.log(`📄 Segment path: ${segmentPath}`);
    
    // Get the shared API instance from the client
    const api = client.getSdkApi();
    
    // If we're requesting a specific segment, stream it directly
    if (segmentPath.endsWith('.ts')) {
      // Extract the segment number from the path
      const segmentNumber = pathParts[pathParts.length - 1].replace('.ts', '');
      console.log(`🔢 Segment number: ${segmentNumber}`);
      
      // Get the playlist ID from the URL parameters
      const playlistId = url.searchParams.get('PlaylistId') || '';
      console.log(`📋 Playlist ID: ${playlistId}`);
      
      // Use the exact URL format that Jellyfin is using
      const streamUrl = `${client['baseUrl']}/Videos/${videoId}/hls/${playlistId}/${segmentNumber}.ts?${url.searchParams.toString()}`;
      console.log(`🔍 Streaming segment URL: ${streamUrl}`);
      
      try {
        const streamResponse = await fetch(streamUrl, {
          headers: {
            'Authorization': `MediaBrowser Token="${api.configuration.headers['X-MediaBrowser-Token']}"`,
            'Accept': 'video/mp2t,video/mp4,video/*;q=0.9,*/*;q=0.8',
            'Range': 'bytes=0-'
          }
        });
        
        console.log(`📥 Stream response status: ${streamResponse.status}`);
        
        if (!streamResponse.ok) {
          const errorText = await streamResponse.text();
          console.error(`❌ Segment stream error:`, {
            status: streamResponse.status,
            statusText: streamResponse.statusText,
            headers: Object.fromEntries(streamResponse.headers.entries()),
            body: errorText
          });
          throw new Error(`Failed to stream segment: ${streamResponse.status} ${streamResponse.statusText}`);
        }
        
        // Get the response body as an ArrayBuffer
        const arrayBuffer = await streamResponse.arrayBuffer();
        console.log(`✅ Received segment data: ${arrayBuffer.byteLength} bytes`);
        
        // Forward the segment response directly with proper headers
        const headers = new Headers();
        headers.set('Content-Type', 'video/mp2t');
        headers.set('Content-Length', arrayBuffer.byteLength.toString());
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
        headers.set('Cache-Control', 'no-cache');
        
        // Copy any relevant headers from the original response
        const contentType = streamResponse.headers.get('content-type');
        if (contentType) {
          headers.set('Content-Type', contentType);
        }
        
        const response = new Response(arrayBuffer, {
          status: 200,
          headers
        });
        
        console.log(`✅ Successfully created segment response`);
        
        return response;
      } catch (error: any) {
        console.error(`❌ Error streaming segment:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: addCorsHeaders(new Headers({
            'Content-Type': 'application/json'
          }))
        });
      }
    }
    
    // Otherwise, we're requesting the playlist
    // Check if this is a master playlist request or a quality-specific playlist
    const isMasterPlaylist = segmentPath === 'master.m3u8';
    const playlistUrl = isMasterPlaylist 
      ? `${client['baseUrl']}/Videos/${videoId}/master.m3u8?${url.searchParams.toString()}`
      : `${client['baseUrl']}/Videos/${videoId}/${segmentPath}?${url.searchParams.toString()}`;
    
    console.log(`🔍 Fetching playlist URL: ${playlistUrl}`);
    
    const playlistResponse = await fetch(playlistUrl, {
      headers: {
        'Authorization': `MediaBrowser Token="${api.configuration.headers['X-MediaBrowser-Token']}"`,
      }
    });
    
    console.log(`📥 Playlist response status: ${playlistResponse.status}`);
    
    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      console.error(`❌ Playlist response error:`, {
        status: playlistResponse.status,
        statusText: playlistResponse.statusText,
        headers: Object.fromEntries(playlistResponse.headers.entries()),
        body: errorText
      });
      throw new Error(`Failed to fetch playlist: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }
    
    console.log(`✅ Playlist fetched successfully`);
    
    // Get the playlist content
    const playlistContent = await playlistResponse.text();
    console.log(`📝 Original playlist content:`, playlistContent);
    
    // Rewrite the playlist URLs to point to our API
    const rewrittenPlaylist = playlistContent.split('\n').map((line: string) => {
      if (line.startsWith('#') || line.trim() === '') {
        return line; // Keep comments and empty lines unchanged
      }
      if (line.includes('.ts')) {
        // Extract just the segment filename (e.g., "404.ts")
        const segmentFile = line.trim().split('/').pop()?.split('?')[0] || '';
        
        // Get the playlist ID from the URL parameters
        const playlistId = url.searchParams.get('PlaylistId') || '';
        
        // Construct URL in the format /Videos/{itemId}/hls/{playlistId}/{segmentId}.{segmentContainer}
        const rewrittenUrl = `/Videos/${videoId}/hls/${playlistId}/${segmentFile}`;
        console.log(`🔄 Rewriting segment URL: ${line.trim()} -> ${rewrittenUrl}`);
        return rewrittenUrl;
      } else if (line.includes('.m3u8')) {
        // For quality-specific playlists in the master playlist
        const qualityPlaylist = line.trim().split('/').pop()?.split('?')[0] || '';
        const rewrittenUrl = `/Videos/${videoId}/hls/${qualityPlaylist}`;
        console.log(`🔄 Rewriting quality playlist URL: ${line.trim()} -> ${rewrittenUrl}`);
        return rewrittenUrl;
      }
      return line;
    }).join('\n');
    
    console.log(`📝 Rewritten playlist content:`, rewrittenPlaylist);
    
    // Set proper headers for the playlist
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.apple.mpegurl');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Cache-Control', 'no-cache');
    
    // Return the rewritten playlist
    const response = new Response(rewrittenPlaylist, {
      status: 200,
      headers
    });
    
    console.log(`✅ Successfully created playlist response`);
    
    return response;
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

    // Get the shared API instance from the client
    const api = client.getSdkApi();
    
    // Get the ItemsApi using the helper function
    const itemsApi = getItemsApi(api);
    
    // Use the SDK to get video details
    const response = await itemsApi.getItems({
      ids: [videoId]
    });
    
    if (!response.data.Items || response.data.Items.length === 0) {
      throw new Error('Failed to fetch video details');
    }
    
    const videoData = response.data.Items[0];
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
  
  // Get the shared API instance from the client
  const api = client.getSdkApi();
  
  // Get the ItemsApi using the helper function
  const itemsApi = getItemsApi(api);
  
  // Use the SDK to get video details
  const response = await itemsApi.getItems({
    ids: [id]
  });
  
  if (!response.data.Items || response.data.Items.length === 0) {
    throw new Error(`Failed to fetch video: Item not found`);
  }
  
  const video = response.data.Items[0];
  console.log(`✅ Found video in Jellyfin: ${video.Name}`);
  
  const newVideo = await addVideo({
    jellyfinId: id,
    name: video.Name || 'Unknown',
    path: video.Path || '',
    type: video.Type || 'Unknown',
    duration: video.RunTimeTicks ? Math.floor(video.RunTimeTicks / 10000000) : null,
    size: null, // Size is not available in the SDK response
    container: null, // Container is not available in the SDK response
    videoCodec: video.MediaStreams?.find((s: any) => s.Type === 'Video')?.Codec || null,
    audioCodec: video.MediaStreams?.find((s: any) => s.Type === 'Audio')?.Codec || null
  });

  console.log(`💾 Cached video metadata`);
  return newVideo;
} 