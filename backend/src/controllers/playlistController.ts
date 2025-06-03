import { JellyfinClient } from "../api/jellyfin.ts";
import {getPlaylistsApi} from "npm:@jellyfin/sdk@0.11.0/lib/utils/api";

export async function handleCreatePlaylist(client: JellyfinClient): Promise<Response> {
    try {
        const playlists = await client.createPlaylist();

        return playlists;
    }
}
