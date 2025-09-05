import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type CreateUserSubmissionInput, type UserSubmission } from '../schema';

export const createUserSubmission = async (input: CreateUserSubmissionInput): Promise<UserSubmission> => {
  try {
    // Insert user submission record
    const result = await db.insert(userSubmissionsTable)
      .values({
        email: input.email,
        picture_data: input.picture_data,
        picture_filename: input.picture_filename,
        picture_mime_type: input.picture_mime_type
        // submitted_at, processed, and external_request_sent have defaults in the schema
      })
      .returning()
      .execute();

    // Return the created submission
    return result[0];
  } catch (error) {
    console.error('User submission creation failed:', error);
    throw error;
  }
};