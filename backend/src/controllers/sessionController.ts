import { JellyfinClient } from "../api/jellyfin.ts";
import { CLIENT_NAME } from "../api/constants.ts";

export async function handleGetSessions(client: JellyfinClient): Promise<string> {
    try {
        const sessions = await client.getSessions();

        const jellyClippingServiceSession = sessions.find(session => session.Client !== CLIENT_NAME);
        const id = jellyClippingServiceSession?.Id;

        if (!id) {
            throw new Error('Jelly Clipping Service Session not found. Log out and log in');
        }

        return id
    }
    catch (error: any) {
        console.error(`❌ failed to get sessions: ${error.message}`);
        return '';
    }
}
