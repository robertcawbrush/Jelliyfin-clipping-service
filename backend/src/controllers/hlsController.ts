import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import { handleVideoDetails } from "./videoController.ts";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api.js";

export async function handleHlsPlaylist(
  client: JellyfinClient,
  req: Request,
  videoId: string
): Promise<Response> {
  try {
    console.log(`🎬 Getting HLS playlist for video: ${videoId}`);
    
    // Get video details using the existing function
    const videoDetailsResponse = await handleVideoDetails(client, req, videoId);
    if (!videoDetailsResponse.ok) {
      throw new Error(`Failed to get video details: ${videoDetailsResponse.statusText}`);
    }
    
    // Get media sources using the SDK
    const api = client.getSdkApi();
    const itemsApi = getItemsApi(api);

    const mediaSourcesResponse = await itemsApi.getItems({
      ids: [videoId],
      fields: ['MediaSources', 'MediaStreams'],
      enableImages: false
    });

    if (!mediaSourcesResponse.data.Items?.[0]?.MediaSources?.[0]) {
      throw new Error('No media source found for video');
    }

    const mediaSource = mediaSourcesResponse.data.Items[0].MediaSources[0];
    const mediaSourceId = mediaSource.Id as string;
    
    // Get HLS stream URL
    const { masterPlaylistUrl } = await client.getHlsStream(videoId, mediaSourceId, {
      container: 'ts',
      enableAdaptiveBitrateStreaming: true
    });
    
    // Fetch the playlist
    const playlistResponse = await fetch(masterPlaylistUrl, {
      headers: {
        'X-MediaBrowser-Token': client['apiKey']
      }
    });
    
    if (!playlistResponse.ok) {
      throw new Error(`Failed to get playlist: ${playlistResponse.statusText}`);
    }
    
    let playlist = await playlistResponse.text();
    
    // Modify the playlist URLs to use the Jellyfin server URL
    const jellyfinBaseUrl = client['baseUrl'];
    playlist = playlist.replace(/^main\.m3u8/, `${jellyfinBaseUrl}/Videos/${videoId}/main.m3u8`);
    
    // Return the playlist with proper headers
    return new Response(playlist, {
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Failed to get HLS playlist: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

export async function handleHlsSegment(
  client: JellyfinClient,
  req: Request,
  segmentPath: string
): Promise<Response> {
  try {
    console.log(`🎬 Getting HLS segment: ${segmentPath}`);
    
    // Construct the segment URL
    const segmentUrl = `${client['baseUrl']}/${segmentPath}`;
    
    // Fetch the segment
    const segmentResponse = await fetch(segmentUrl, {
      headers: {
        'X-MediaBrowser-Token': client['apiKey']
      }
    });
    
    if (!segmentResponse.ok) {
      throw new Error(`Failed to get segment: ${segmentResponse.statusText}`);
    }
    
    // Return the segment with proper headers
    return new Response(segmentResponse.body, {
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'video/mp2t',
        'Cache-Control': 'no-cache'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Failed to get HLS segment: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
} 