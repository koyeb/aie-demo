import { z } from 'zod';

// Input schema for creating user submissions
export const createUserSubmissionInputSchema = z.object({
  email: z.string().email(),
  picture_data: z.string().min(1), // Base64 encoded image data, must not be empty
  picture_filename: z.string().min(1),
  picture_mime_type: z.string().regex(/^image\//) // Must be an image MIME type
});

export type CreateUserSubmissionInput = z.infer<typeof createUserSubmissionInputSchema>;

// Response schema for successful submission
export const submissionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  submission_id: z.number()
});

export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;