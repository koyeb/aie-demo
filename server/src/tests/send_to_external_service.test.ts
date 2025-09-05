import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type CreateUserSubmissionInput, type UserSubmission } from '../schema';
import { sendToExternalService } from '../handlers/send_to_external_service';
import { eq } from 'drizzle-orm';

// Test submission data
const testSubmissionInput: CreateUserSubmissionInput = {
  email: 'test@example.com',
  picture_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77ygAAAABJRU5ErkJggg==',
  picture_filename: 'test-image.png',
  picture_mime_type: 'image/png'
};

// Mock fetch globally for tests
const originalFetch = globalThis.fetch;

const mockFetch = (response: Response | Promise<Response> | Error) => {
  globalThis.fetch = Object.assign(
    async (): Promise<Response> => {
      if (response instanceof Error) {
        throw response;
      }
      return await response;
    },
    { preconnect: () => {} } // Add preconnect property to satisfy TypeScript
  ) as any;
};

const restoreFetch = () => {
  globalThis.fetch = originalFetch;
};

describe('sendToExternalService', () => {
  beforeEach(async () => {
    await createDB();
  });
  afterEach(async () => {
    await resetDB();
    restoreFetch();
  });

  const createTestSubmission = async (): Promise<UserSubmission> => {
    const result = await db.insert(userSubmissionsTable)
      .values({
        email: testSubmissionInput.email,
        picture_data: testSubmissionInput.picture_data,
        picture_filename: testSubmissionInput.picture_filename,
        picture_mime_type: testSubmissionInput.picture_mime_type,
        processed: false,
        external_request_sent: false
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should successfully send submission to external service', async () => {
    // Set up environment variable
    process.env['EXTERNAL_SERVICE_URL'] = 'https://api.example.com/submissions';

    // Mock successful response
    mockFetch(new Response('{"success": true}', { status: 200 }));

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    const result = await sendToExternalService(submission);

    expect(result).toBe(true);

    // Verify external_request_sent was updated
    const updatedSubmission = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    expect(updatedSubmission).toHaveLength(1);
    expect(updatedSubmission[0].external_request_sent).toBe(true);
  });

  it('should return false when EXTERNAL_SERVICE_URL is not set', async () => {
    // Remove environment variable
    delete process.env['EXTERNAL_SERVICE_URL'];

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    const result = await sendToExternalService(submission);

    expect(result).toBe(false);

    // Verify external_request_sent was NOT updated
    const updatedSubmission = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    expect(updatedSubmission[0].external_request_sent).toBe(false);
  });

  it('should handle HTTP error responses', async () => {
    // Set up environment variable
    process.env['EXTERNAL_SERVICE_URL'] = 'https://api.example.com/submissions';

    // Mock error response
    mockFetch(new Response('{"error": "Bad Request"}', { status: 400, statusText: 'Bad Request' }));

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    const result = await sendToExternalService(submission);

    expect(result).toBe(false);

    // Verify external_request_sent was NOT updated
    const updatedSubmission = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    expect(updatedSubmission[0].external_request_sent).toBe(false);
  });

  it('should handle network timeout errors', async () => {
    // Set up environment variables
    process.env['EXTERNAL_SERVICE_URL'] = 'https://api.example.com/submissions';
    process.env['EXTERNAL_SERVICE_TIMEOUT_MS'] = '100';

    // Mock timeout error
    const timeoutError = new Error('Request timed out');
    timeoutError.name = 'TimeoutError';
    mockFetch(timeoutError);

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    const result = await sendToExternalService(submission);

    expect(result).toBe(false);

    // Verify external_request_sent was NOT updated
    const updatedSubmission = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    expect(updatedSubmission[0].external_request_sent).toBe(false);
  });

  it('should handle network connection errors', async () => {
    // Set up environment variable
    process.env['EXTERNAL_SERVICE_URL'] = 'https://api.example.com/submissions';

    // Mock network error
    const networkError = new Error('Failed to fetch');
    mockFetch(networkError);

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    const result = await sendToExternalService(submission);

    expect(result).toBe(false);

    // Verify external_request_sent was NOT updated
    const updatedSubmission = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, submission.id))
      .execute();

    expect(updatedSubmission[0].external_request_sent).toBe(false);
  });

  it('should use default timeout when EXTERNAL_SERVICE_TIMEOUT_MS is not set', async () => {
    // Set up environment variable without timeout
    process.env['EXTERNAL_SERVICE_URL'] = 'https://api.example.com/submissions';
    delete process.env['EXTERNAL_SERVICE_TIMEOUT_MS'];

    // Mock successful response
    mockFetch(new Response('{"success": true}', { status: 200 }));

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    const result = await sendToExternalService(submission);

    expect(result).toBe(true);
  });

  it('should send correct payload structure to external service', async () => {
    // Set up environment variable
    process.env['EXTERNAL_SERVICE_URL'] = 'https://api.example.com/submissions';

    let capturedPayload: any;
    
    // Mock fetch to capture the request payload
    globalThis.fetch = Object.assign(
      async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
        if (options?.body && typeof options.body === 'string') {
          capturedPayload = JSON.parse(options.body);
        }
        return new Response('{"success": true}', { status: 200 });
      },
      { preconnect: () => {} }
    ) as any;

    // Create test submission
    const submission = await createTestSubmission();

    // Send to external service
    await sendToExternalService(submission);

    // Verify payload structure
    expect(capturedPayload).toBeDefined();
    expect(capturedPayload.email).toEqual(testSubmissionInput.email);
    expect(capturedPayload.picture_data).toEqual(testSubmissionInput.picture_data);
    expect(capturedPayload.picture_filename).toEqual(testSubmissionInput.picture_filename);
    expect(capturedPayload.picture_mime_type).toEqual(testSubmissionInput.picture_mime_type);
    expect(capturedPayload.submitted_at).toBeDefined();
    expect(typeof capturedPayload.submitted_at).toBe('string');
  });
});