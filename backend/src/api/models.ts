import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  dateAdded: integer('date_added', { mode: 'timestamp' }).notNull().default(Date.now()),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().default(Date.now())
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;