import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type UserSubmission } from '../schema';
import { eq } from 'drizzle-orm';

export const sendToExternalService = async (submission: UserSubmission): Promise<boolean> => {
  try {
    // Read external service endpoint from environment variables
    const endpointUrl = process.env['EXTERNAL_SERVICE_URL'];
    if (!endpointUrl) {
      console.error('EXTERNAL_SERVICE_URL environment variable not set');
      return false;
    }

    // Prepare payload for external service
    const payload = {
      email: submission.email,
      picture_data: submission.picture_data,
      picture_filename: submission.picture_filename,
      picture_mime_type: submission.picture_mime_type,
      submitted_at: submission.submitted_at.toISOString()
    };

    // Make HTTP POST request to external service
    const timeoutMs = parseInt(process.env['EXTERNAL_SERVICE_TIMEOUT_MS'] || '30000');
    
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });

    // Check if request was successful
    if (!response.ok) {
      console.error(`External service request failed with status ${response.status}: ${response.statusText}`);
      return false;
    }

    // Update submission record to mark external_request_sent as true
    await db.update(userSubmissionsTable)
      .set({ external_request_sent: true })
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    console.log(`Successfully sent submission ${submission.id} to external service`);
    return true;

  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(`External service request timed out for submission ${submission.id}:`, error);
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.error(`External service request was aborted for submission ${submission.id}:`, error);
    } else {
      console.error(`External service request failed for submission ${submission.id}:`, error);
    }
    return false;
  }
};