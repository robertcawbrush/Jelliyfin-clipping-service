import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";

export async function handleHlsPlaylist(
  client: JellyfinClient,
  req: Request,
  videoId: string,
): Promise<Response> {
  try {
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
