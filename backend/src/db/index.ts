import { DB } from "sqlite";
import { drizzle } from 'drizzle-orm/libsql';
import { eq, and } from "drizzle-orm";
import { videos, clips, type Video, type InsertVideo, type Clip, type InsertClip } from "../api/models.ts";

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

  CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    file_path TEXT,
    date_created INTEGER NOT NULL DEFAULT (unixepoch()),
    last_updated INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// Create Drizzle database instance
export const db = drizzle(sqlite);

// Video functions
export async function addVideo(video: InsertVideo): Promise<Video> {
  return await db.insert(videos).values(video).returning().get();
}

export async function getVideoByJellyfinId(jellyfinId: string): Promise<Video | undefined> {
  return await db.select().from(videos).where(eq(videos.jellyfinId, jellyfinId)).get();
}

// Clip functions
export async function createClip(clip: InsertClip): Promise<Clip> {
  return await db.insert(clips).values(clip).returning().get();
}

export async function getClipsByUserId(userId: string): Promise<Clip[]> {
  return await db.select().from(clips).where(eq(clips.userId, userId)).all();
}

export async function getClipById(id: number): Promise<Clip | undefined> {
  return await db.select().from(clips).where(eq(clips.id, id)).get();
}

export async function updateClipStatus(id: number, status: string, filePath?: string): Promise<Clip> {
  const updateData: Partial<Clip> = {
    status,
    lastUpdated: new Date()
  };
  
  if (filePath) {
    updateData.filePath = filePath;
  }
  
  return await db.update(clips)
    .set(updateData)
    .where(eq(clips.id, id))
    .returning()
    .get();
}

export async function deleteClip(id: number): Promise<void> {
  await db.delete(clips).where(eq(clips.id, id));
}

export { type Video, type InsertVideo }; 