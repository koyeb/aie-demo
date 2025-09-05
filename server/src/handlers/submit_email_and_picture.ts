import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type CreateUserSubmissionInput, type SubmissionResponse, type UserSubmission } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to create user submission
const createUserSubmissionRecord = async (input: CreateUserSubmissionInput): Promise<UserSubmission> => {
  try {
    const result = await db.insert(userSubmissionsTable)
      .values({
        email: input.email,
        picture_data: input.picture_data,
        picture_filename: input.picture_filename,
        picture_mime_type: input.picture_mime_type
        // submitted_at, processed, and external_request_sent will use their default values
      })
      .returning()
      .execute();

    const submission = result[0];
    return {
      ...submission,
      submitted_at: new Date(submission.submitted_at) // Ensure proper Date type
    };
  } catch (error) {
    console.error('User submission creation failed:', error);
    throw error;
  }
};

// Helper function to simulate external service call
const sendToExternalServiceRequest = async (submission: UserSubmission): Promise<boolean> => {
  try {
    // Simulate external service call (in real implementation, this would make HTTP request)
    // For now, we'll just update the external_request_sent flag
    await db.update(userSubmissionsTable)
      .set({ external_request_sent: true })
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    return true;
  } catch (error) {
    console.error('External service request failed:', error);
    return false;
  }
};

export const submitEmailAndPicture = async (input: CreateUserSubmissionInput): Promise<SubmissionResponse> => {
  try {
    // Create the submission record
    const submission = await createUserSubmissionRecord(input);
    
    // Send to external service
    const externalRequestSent = await sendToExternalServiceRequest(submission);
    
    if (!externalRequestSent) {
      console.warn(`External service request failed for submission ${submission.id}`);
    }
    
    return {
      success: true,
      message: "Thanks! You'll receive your picture by email soon!",
      submission_id: submission.id
    };
  } catch (error) {
    console.error('Submit email and picture failed:', error);
    return {
      success: false,
      message: "Failed to process your submission. Please try again.",
      submission_id: 0
    };
  }
};