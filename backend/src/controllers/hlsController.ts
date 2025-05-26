import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import { getDynamicHlsApi } from "@jellyfin/sdk/lib/utils/api/dynamic-hls-api.js";

export async function handleHlsPlaylist(
  client: JellyfinClient,
  req: Request,
  videoId: string,
): Promise<Response> {
  try {
    // TODO: make a call to get the master playlist
    // masterSourceId is the same as videoId for some reason
    const playlist = await client.getHlsMasterPlaylist(videoId, videoId);
    const data = playlist.data.toString();

    const apiPrependedData = data.replace(
        /(main\.m3u8\?[^ \n\r]*)/,
        `${client.jcsurl}/api/$1`
    );

    return new Response(JSON.stringify(apiPrependedData, null, 2), {
      status: 200,
      headers: addCorsHeaders(
        new Headers({
          "Content-Type": "application/json",
        }),
      ),
    });
  } catch (error: any) {
    console.error(`❌ Failed to get HLS playlist: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(
        new Headers({
          "Content-Type": "application/json",
        }),
      ),
    });
  }
}
