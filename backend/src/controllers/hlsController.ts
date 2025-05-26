import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";
import { getPlaylistsApi } from "npm:@jellyfin/sdk@0.11.0/lib/utils/api";

export async function handleHlsMasterPlaylist(
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
    console.error(`❌ Failed to get HLS Master playlist: ${error.message}`);
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

export async function handleHlsMainPlaylist(
    client: JellyfinClient,
    req: Request,
    mediaSourceid: string,
): Promise<Response> {
  try {
    const { data } = await client.getHlsVariantPlaylist(mediaSourceid);

    const apiPrependedData = data.replace(
        /(hls1\/main\/\d+\.ts\?[^ \n\r]*)/g,
        `${client.jcsurl}/api/video-segment/$1`
    );
    const fixedPlaylist = apiPrependedData.replace(/\\n/g, '\n');

    return new Response(fixedPlaylist, {
      status: 200,
      headers: addCorsHeaders(
          new Headers({
                        "Content-Type": "application/vnd.apple.mpegurl",
                      }),
      ),
    });
  } catch (error: any) {
    console.error(`❌ Failed to get HLS Main playlist: ${error.message}`);
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

export async function handleGetVideoSegment(
    client: JellyfinClient,
    req: Request,
    mediaSourceid: string,
    playlistId: string,
    segmentId: string,
    container: string,
    runtimeTicks: string,
    actualSegmentLengthTicks: string,
): Promise<Response> {
  try {
    const { data } = await client.getHlsVideoSegment(
        mediaSourceid,
        playlistId,
        segmentId,
        container,
        runtimeTicks,
        actualSegmentLengthTicks,
    );

    return new Response(data, {
      status: 200,
      headers: addCorsHeaders(
          new Headers({
                        "Content-Type": "application/vnd.apple.mpegurl",
                      }),
      ),
    });
  } catch (error: any) {
    console.error(`❌ Failed to get HLS segment ${segment}.${container} ${error.message}`);
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
