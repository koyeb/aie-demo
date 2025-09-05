import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSubmissionsTable } from '../db/schema';
import { type CreateUserSubmissionInput } from '../schema';
import { createUserSubmission } from '../handlers/create_user_submission';
import { eq } from 'drizzle-orm';

// Valid base64 image data (minimal PNG)
const validBase64ImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Test input with all required fields
const testInput: CreateUserSubmissionInput = {
  email: 'test@example.com',
  picture_data: validBase64ImageData,
  picture_filename: 'test-image.png',
  picture_mime_type: 'image/png'
};

describe('createUserSubmission', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user submission with valid input', async () => {
    const result = await createUserSubmission(testInput);

    // Verify all fields are properly set
    expect(result.email).toEqual('test@example.com');
    expect(result.picture_data).toEqual(validBase64ImageData);
    expect(result.picture_filename).toEqual('test-image.png');
    expect(result.picture_mime_type).toEqual('image/png');
    expect(result.id).toBeDefined();
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.processed).toEqual(false);
    expect(result.external_request_sent).toEqual(false);
  });

  it('should save user submission to database', async () => {
    const result = await createUserSubmission(testInput);

    // Verify the record was actually saved to the database
    const submissions = await db.select()
      .from(userSubmissionsTable)
      .where(eq(userSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].email).toEqual('test@example.com');
    expect(submissions[0].picture_data).toEqual(validBase64ImageData);
    expect(submissions[0].picture_filename).toEqual('test-image.png');
    expect(submissions[0].picture_mime_type).toEqual('image/png');
    expect(submissions[0].submitted_at).toBeInstanceOf(Date);
    expect(submissions[0].processed).toEqual(false);
    expect(submissions[0].external_request_sent).toEqual(false);
  });

  it('should handle different image types', async () => {
    const jpegInput: CreateUserSubmissionInput = {
      email: 'jpeg@example.com',
      picture_data: validBase64ImageData,
      picture_filename: 'photo.jpg',
      picture_mime_type: 'image/jpeg'
    };

    const result = await createUserSubmission(jpegInput);

    expect(result.picture_mime_type).toEqual('image/jpeg');
    expect(result.picture_filename).toEqual('photo.jpg');
    expect(result.email).toEqual('jpeg@example.com');
  });

  it('should create multiple submissions with unique IDs', async () => {
    const firstResult = await createUserSubmission(testInput);
    
    const secondInput: CreateUserSubmissionInput = {
      ...testInput,
      email: 'second@example.com',
      picture_filename: 'second-image.png'
    };
    const secondResult = await createUserSubmission(secondInput);

    // Verify both submissions have different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.email).toEqual('test@example.com');
    expect(secondResult.email).toEqual('second@example.com');

    // Verify both are in database
    const allSubmissions = await db.select()
      .from(userSubmissionsTable)
      .execute();

    expect(allSubmissions).toHaveLength(2);
  });

  it('should set default values correctly', async () => {
    const result = await createUserSubmission(testInput);

    // Verify default values are applied
    expect(result.processed).toEqual(false);
    expect(result.external_request_sent).toEqual(false);
    expect(result.submitted_at).toBeInstanceOf(Date);
    
    // Verify submitted_at is recent (within last 5 seconds)
    const now = new Date();
    const timeDiff = now.getTime() - result.submitted_at.getTime();
    expect(timeDiff).toBeLessThan(5000);
  });

  it('should handle long base64 data', async () => {
    // Create a longer base64 string to test data handling
    const longBase64 = validBase64ImageData.repeat(100);
    const longDataInput: CreateUserSubmissionInput = {
      ...testInput,
      picture_data: longBase64
    };

    const result = await createUserSubmission(longDataInput);

    expect(result.picture_data).toEqual(longBase64);
    expect(result.picture_data.length).toBeGreaterThan(1000);
  });
});