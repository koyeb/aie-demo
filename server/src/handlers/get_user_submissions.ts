import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type UserSubmission } from '../schema';
import { desc } from 'drizzle-orm';

export const getUserSubmissions = async (): Promise<UserSubmission[]> => {
  try {
    // Fetch all user submissions, ordered by most recent first
    const results = await db.select()
      .from(userSubmissionsTable)
      .orderBy(desc(userSubmissionsTable.submitted_at))
      .execute();

    // Convert database results to schema type
    // No numeric conversions needed for this table
    return results.map(submission => ({
      id: submission.id,
      email: submission.email,
      picture_data: submission.picture_data,
      picture_filename: submission.picture_filename,
      picture_mime_type: submission.picture_mime_type,
      submitted_at: submission.submitted_at,
      processed: submission.processed,
      external_request_sent: submission.external_request_sent
    }));
  } catch (error) {
    console.error('Failed to fetch user submissions:', error);
    throw error;
  }
};