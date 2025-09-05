import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type CreateUserSubmissionInput } from '../schema';
import { submitEmailAndPicture } from '../handlers/submit_email_and_picture';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserSubmissionInput = {
  email: 'test@example.com',
  picture_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel PNG in base64
  picture_filename: 'test-image.png',
  picture_mime_type: 'image/png'
};

describe('submitEmailAndPicture', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully process a valid submission', async () => {
    const result = await submitEmailAndPicture(testInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual("Thanks! You'll receive your picture by email soon!");
    expect(result.submission_id).toBeGreaterThan(0);
    expect(typeof result.submission_id).toBe('number');
  });

  it('should create a user submission record in the database', async () => {
    const result = await submitEmailAndPicture(testInput);

    const submissions = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, result.submission_id))
      .execute();

    expect(submissions).toHaveLength(1);
    const submission = submissions[0];
    
    expect(submission.email).toEqual(testInput.email);
    expect(submission.picture_data).toEqual(testInput.picture_data);
    expect(submission.picture_filename).toEqual(testInput.picture_filename);
    expect(submission.picture_mime_type).toEqual(testInput.picture_mime_type);
    expect(submission.submitted_at).toBeInstanceOf(Date);
    expect(submission.processed).toBe(false);
    expect(submission.external_request_sent).toBe(true); // Should be updated by external service call
  });

  it('should handle different image types correctly', async () => {
    const jpegInput: CreateUserSubmissionInput = {
      email: 'jpeg-test@example.com',
      picture_data: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A', // 1x1 pixel JPEG in base64
      picture_filename: 'test-photo.jpg',
      picture_mime_type: 'image/jpeg'
    };

    const result = await submitEmailAndPicture(jpegInput);

    expect(result.success).toBe(true);
    expect(result.submission_id).toBeGreaterThan(0);

    // Verify the record was saved with correct MIME type
    const submissions = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, result.submission_id))
      .execute();

    expect(submissions[0].picture_mime_type).toEqual('image/jpeg');
  });

  it('should handle multiple submissions from same email', async () => {
    // Submit first image
    const result1 = await submitEmailAndPicture(testInput);
    expect(result1.success).toBe(true);

    // Submit second image with same email but different filename
    const secondInput: CreateUserSubmissionInput = {
      ...testInput,
      picture_filename: 'second-image.png',
      picture_data: 'different_base64_data_here'
    };

    const result2 = await submitEmailAndPicture(secondInput);
    expect(result2.success).toBe(true);
    expect(result2.submission_id).not.toEqual(result1.submission_id);

    // Verify both records exist
    const allSubmissions = await db.select()
      .from(userSubmissionsTable)
      .execute();

    expect(allSubmissions).toHaveLength(2);
    expect(allSubmissions.every(s => s.email === testInput.email)).toBe(true);
    expect(allSubmissions.map(s => s.picture_filename)).toContain('test-image.png');
    expect(allSubmissions.map(s => s.picture_filename)).toContain('second-image.png');
  });

  it('should set correct default values for new submissions', async () => {
    const result = await submitEmailAndPicture(testInput);

    const submission = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, result.submission_id))
      .execute();

    expect(submission[0].processed).toBe(false);
    expect(submission[0].external_request_sent).toBe(true); // Updated by external service call
    expect(submission[0].submitted_at).toBeInstanceOf(Date);
    
    // Verify submitted_at is recent (within last 5 seconds)
    const timeDiff = Date.now() - submission[0].submitted_at.getTime();
    expect(timeDiff).toBeLessThan(5000);
  });

  it('should return proper response format on success', async () => {
    const result = await submitEmailAndPicture(testInput);

    // Verify all required response fields are present
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('submission_id');

    // Verify field types
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
    expect(typeof result.submission_id).toBe('number');

    // Verify success response values
    expect(result.success).toBe(true);
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.submission_id).toBeGreaterThan(0);
  });

  it('should handle various email formats correctly', async () => {
    const emailVariations = [
      'simple@test.com',
      'user.name@domain.co.uk',
      'test+tag@example.org',
      'user123@sub.domain.com'
    ];

    for (const email of emailVariations) {
      const input = { ...testInput, email };
      const result = await submitEmailAndPicture(input);
      
      expect(result.success).toBe(true);
      
      const submission = await db.select()
        .from(userSubmissionsTable)
        .where(eq(userSubmissionsTable.id, result.submission_id))
        .execute();
      
      expect(submission[0].email).toEqual(email);
    }
  });
});