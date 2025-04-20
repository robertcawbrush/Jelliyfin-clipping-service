import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const videos = sqliteTable('videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jellyfinId: text('jellyfin_id').notNull().unique(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  type: text('type').notNull(),
  duration: integer('duration'), // Duration in seconds
  size: integer('size'), // File size in bytes
  container: text('container'), // File container format (mp4, mkv, etc)
  videoCodec: text('video_codec'),
  audioCodec: text('audio_codec'),
  dateAdded: integer('date_added', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
});

export const clips = sqliteTable('clips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  videoId: text('video_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull(), // Format: HH:MM:SS
  endTime: text('end_time').notNull(), // Format: HH:MM:SS
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  filePath: text('file_path'),
  dateCreated: integer('date_created', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
});

// Types for TypeScript
export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;
export type Clip = typeof clips.$inferSelect;
export type InsertClip = typeof clips.$inferInsert;