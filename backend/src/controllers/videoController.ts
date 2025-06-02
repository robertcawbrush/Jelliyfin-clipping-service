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
  // TODO: not used yet
  console.log(`📝 GET /api/video/${videoId}`);
  
  try {

    const params = {
      ids: [videoId],
      fields: ['Path', 'Overview', 'MediaSources', 'MediaStreams'],
    }

    const api = client.getSdkApi();
    const response = await getItemsApi(api).getItems(params)


     if (!response.data.Items) {
      console.error(`❌ No video found with id of  ${videoId}`);
      throw new Error(`No video found with id of  ${videoId}`);
    }

    const video = response.data.Items[0];

    console.log(`✅ Successfully served video by id: ${video?.name}`);
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
