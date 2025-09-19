import { z } from 'zod';

// Input schema for creating user submissions
export const createUserSubmissionInputSchema = z.object({
  name: z.string().min(1), // User's name
  email: z.string().email(),
  picture_data: z.string().min(1), // Base64 encoded image data, must not be empty
  picture_filename: z.string().min(1),
  picture_mime_type: z.string().regex(/^image\//) // Must be an image MIME type
});

export type CreateUserSubmissionInput = z.infer<typeof createUserSubmissionInputSchema>;

// Response schema for successful submission
export const submissionResponseSchema = z.object({
  success: z.boolean(),
});

export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;

// Scene schema for admin functionality - matches Python database model
export const sceneSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.string(),
  modified_at: z.string(),
  fpath: z.string(),
  description: z.string().nullable(),
  edit_prompt: z.string().nullable(),
  result: z.string().nullable(),
});

export type Scene = z.infer<typeof sceneSchema>;

// Response schema for scenes list
export const scenesResponseSchema = z.array(sceneSchema);

export type ScenesResponse = z.infer<typeof scenesResponseSchema>;
