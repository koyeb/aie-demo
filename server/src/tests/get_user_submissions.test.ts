import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type CreateUserSubmissionInput } from '../schema';
import { getUserSubmissions } from '../handlers/get_user_submissions';

// Test data for user submissions
const testSubmission1: Omit<CreateUserSubmissionInput, 'id'> = {
  email: 'user1@example.com',
  picture_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel PNG base64
  picture_filename: 'test1.png',
  picture_mime_type: 'image/png'
};

const testSubmission2: Omit<CreateUserSubmissionInput, 'id'> = {
  email: 'user2@example.com',
  picture_data: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // 1x1 pixel GIF base64
  picture_filename: 'test2.gif',
  picture_mime_type: 'image/gif'
};

describe('getUserSubmissions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no submissions exist', async () => {
    const result = await getUserSubmissions();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all user submissions', async () => {
    // Create test submissions in database
    await db.insert(userSubmissionsTable)
      .values([
        {
          email: testSubmission1.email,
          picture_data: testSubmission1.picture_data,
          picture_filename: testSubmission1.picture_filename,
          picture_mime_type: testSubmission1.picture_mime_type
        },
        {
          email: testSubmission2.email,
          picture_data: testSubmission2.picture_data,
          picture_filename: testSubmission2.picture_filename,
          picture_mime_type: testSubmission2.picture_mime_type
        }
      ])
      .execute();

    const result = await getUserSubmissions();

    expect(result).toHaveLength(2);
    
    // Find submissions by email since ordering may vary for simultaneous inserts
    const submission1 = result.find(s => s.email === testSubmission1.email);
    const submission2 = result.find(s => s.email === testSubmission2.email);

    // Check first submission
    expect(submission1).toBeDefined();
    expect(submission1!.email).toEqual(testSubmission1.email);
    expect(submission1!.picture_data).toEqual(testSubmission1.picture_data);
    expect(submission1!.picture_filename).toEqual(testSubmission1.picture_filename);
    expect(submission1!.picture_mime_type).toEqual(testSubmission1.picture_mime_type);
    expect(submission1!.id).toBeDefined();
    expect(submission1!.submitted_at).toBeInstanceOf(Date);
    expect(submission1!.processed).toBe(false);
    expect(submission1!.external_request_sent).toBe(false);

    // Check second submission
    expect(submission2).toBeDefined();
    expect(submission2!.email).toEqual(testSubmission2.email);
    expect(submission2!.picture_data).toEqual(testSubmission2.picture_data);
    expect(submission2!.picture_filename).toEqual(testSubmission2.picture_filename);
    expect(submission2!.picture_mime_type).toEqual(testSubmission2.picture_mime_type);
    expect(submission2!.id).toBeDefined();
    expect(submission2!.submitted_at).toBeInstanceOf(Date);
    expect(submission2!.processed).toBe(false);
    expect(submission2!.external_request_sent).toBe(false);
  });

  it('should return submissions ordered by most recent first', async () => {
    // Create first submission
    const firstSubmission = await db.insert(userSubmissionsTable)
      .values({
        email: testSubmission1.email,
        picture_data: testSubmission1.picture_data,
        picture_filename: testSubmission1.picture_filename,
        picture_mime_type: testSubmission1.picture_mime_type
      })
      .returning()
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second submission
    const secondSubmission = await db.insert(userSubmissionsTable)
      .values({
        email: testSubmission2.email,
        picture_data: testSubmission2.picture_data,
        picture_filename: testSubmission2.picture_filename,
        picture_mime_type: testSubmission2.picture_mime_type
      })
      .returning()
      .execute();

    const result = await getUserSubmissions();

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].id).toEqual(secondSubmission[0].id);
    expect(result[1].id).toEqual(firstSubmission[0].id);
    
    // Verify timestamps are in descending order
    expect(result[0].submitted_at.getTime()).toBeGreaterThanOrEqual(result[1].submitted_at.getTime());
  });

  it('should return submissions with different processing states', async () => {
    // Create submissions with different processing states
    await db.insert(userSubmissionsTable)
      .values([
        {
          email: testSubmission1.email,
          picture_data: testSubmission1.picture_data,
          picture_filename: testSubmission1.picture_filename,
          picture_mime_type: testSubmission1.picture_mime_type,
          processed: true,
          external_request_sent: true
        },
        {
          email: testSubmission2.email,
          picture_data: testSubmission2.picture_data,
          picture_filename: testSubmission2.picture_filename,
          picture_mime_type: testSubmission2.picture_mime_type,
          processed: false,
          external_request_sent: false
        }
      ])
      .execute();

    const result = await getUserSubmissions();

    expect(result).toHaveLength(2);
    
    // Find the processed submission (order is by timestamp, not processing state)
    const processedSubmission = result.find(s => s.processed === true);
    const unprocessedSubmission = result.find(s => s.processed === false);

    expect(processedSubmission).toBeDefined();
    expect(processedSubmission!.processed).toBe(true);
    expect(processedSubmission!.external_request_sent).toBe(true);

    expect(unprocessedSubmission).toBeDefined();
    expect(unprocessedSubmission!.processed).toBe(false);
    expect(unprocessedSubmission!.external_request_sent).toBe(false);
  });

  it('should handle large number of submissions', async () => {
    // Create multiple submissions
    const submissions = Array.from({ length: 5 }, (_, i) => ({
      email: `user${i}@example.com`,
      picture_data: testSubmission1.picture_data,
      picture_filename: `test${i}.png`,
      picture_mime_type: 'image/png'
    }));

    await db.insert(userSubmissionsTable)
      .values(submissions)
      .execute();

    const result = await getUserSubmissions();

    expect(result).toHaveLength(5);
    
    // Verify all have unique emails
    const emails = result.map(s => s.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toEqual(5);

    // Verify all have required fields
    result.forEach(submission => {
      expect(submission.id).toBeDefined();
      expect(submission.email).toMatch(/^user\d@example\.com$/);
      expect(submission.picture_data).toEqual(testSubmission1.picture_data);
      expect(submission.picture_filename).toMatch(/^test\d\.png$/);
      expect(submission.picture_mime_type).toEqual('image/png');
      expect(submission.submitted_at).toBeInstanceOf(Date);
      expect(typeof submission.processed).toBe('boolean');
      expect(typeof submission.external_request_sent).toBe('boolean');
    });
  });
});