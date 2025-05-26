import { JellyfinClient } from "../api/jellyfin.ts";

export async function handleHlsPlaylist(
    client: JellyfinClient,
    req: Request,
    videoId: string
): Promise<Response> {
  try {
      return new Promise(() => 'This sint implemented')
  } catch {
    return new Promise(() => 'not implemented')
  }
}