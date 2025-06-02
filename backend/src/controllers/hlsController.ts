import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";

export async function handleHlsMasterPlaylist(
  client: JellyfinClient,
  videoId: string,
): Promise<Response> {
  try {
    // masterSourceId is the same as videoId for some reason
    const masterPlaylistResponse = await client.getHlsMasterPlaylist(videoId, videoId);
    const data = masterPlaylistResponse.data.toString();

    const apiPrependedData = data.replace(
        /(main\.m3u8\?[^ \n\r]*)/,
        `${client.jcsurl}/api/$1`
    );
    const fixedPlaylist = apiPrependedData.replace(/\\n/g, '\n');

    return new Response(JSON.stringify(fixedPlaylist, null, 2), {
      status: res.status,
      headers: addCorsHeaders(
        new Headers({
                      "Content-Type": "application/vnd.apple.mpegurl",
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
    mediaSourceid: string,
): Promise<Response> {
  try {
    const { data, status } = await client.getHlsVariantPlaylist(mediaSourceid);

    const apiPrependedData = data.replace(
        /(hls1\/main\/\d+\.ts\?[^ \n\r]*)/g,
        `${client.jcsurl}/api/video-segment/$1`
    );
    const fixedPlaylist = apiPrependedData.replace(/\\n/g, '\n');

    return new Response(fixedPlaylist, {
      status: status,
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
    itemId: string,
    segmentId: string,
    container: string,
    runtimeTicks: string,
    actualSegmentLengthTicks: string,
): Promise<Response> {
  try {
    const res = await client.getHlsVideoSegment(
        itemId,
        parseInt(segmentId, 10),
        container,
        parseInt(runtimeTicks, 10),
        parseInt(actualSegmentLengthTicks, 10),
    );

    return new Response(res.data, {
      status: res.status,
      headers: addCorsHeaders(
          new Headers({
                        "Content-Type": "video/mp2t",
                      }),
      ),
    });
  } catch (error: any) {
    console.error(`❌ Failed to get HLS segment ${segmentId}.${container} ${error.message}`);
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
