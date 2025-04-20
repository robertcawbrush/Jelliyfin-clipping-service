import { DB } from "sqlite";
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from "drizzle-orm";
import { videos, type Video, type InsertVideo } from "../api/models.ts";

// Use the data directory for the database file
const DB_PATH = "./data/jellyfin.db";

// Create SQLite database connection
const sqlite = new DB(DB_PATH);

// Create tables if they don't exist
sqlite.execute(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jellyfin_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL,
    duration INTEGER,
    size INTEGER,
    container TEXT,
    video_codec TEXT,
    audio_codec TEXT,
    date_added INTEGER NOT NULL DEFAULT (unixepoch()),
    last_updated INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// Create Drizzle database instance
export const db = drizzle(sqlite);

// Example function to add a video
export async function addVideo(video: InsertVideo): Promise<Video> {
  const result = await db.insert(videos).values(video).returning().get();
  return result!;
}

// Example function to get video by jellyfin ID
export async function getVideoByJellyfinId(jellyfinId: string): Promise<Video | undefined> {
  return await db
    .select()
    .from(videos)
    .where(eq(videos.jellyfinId, jellyfinId))
    .get();
}

export { type Video, type InsertVideo }; 