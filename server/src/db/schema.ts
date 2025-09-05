import { serial, text, pgTable, timestamp, boolean } from 'drizzle-orm/pg-core';

export const userSubmissionsTable = pgTable('user_submissions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  picture_data: text('picture_data').notNull(), // Base64 encoded image data
  picture_filename: text('picture_filename').notNull(),
  picture_mime_type: text('picture_mime_type').notNull(),
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
  processed: boolean('processed').default(false).notNull(),
  external_request_sent: boolean('external_request_sent').default(false).notNull()
});

// TypeScript types for the table schema
export type UserSubmission = typeof userSubmissionsTable.$inferSelect; // For SELECT operations
export type NewUserSubmission = typeof userSubmissionsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { userSubmissions: userSubmissionsTable };