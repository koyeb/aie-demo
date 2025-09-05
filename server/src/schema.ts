import { z } from 'zod';

// User submission schema
export const userSubmissionSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  picture_data: z.string(), // Base64 encoded image data
  picture_filename: z.string(),
  picture_mime_type: z.string(),
  submitted_at: z.coerce.date(),
  processed: z.boolean().default(false),
  external_request_sent: z.boolean().default(false)
});

export type UserSubmission = z.infer<typeof userSubmissionSchema>;

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

// Schema for external service configuration
export const externalServiceConfigSchema = z.object({
  endpoint_url: z.string().url(),
  timeout_ms: z.number().default(30000)
});

export type ExternalServiceConfig = z.infer<typeof externalServiceConfigSchema>;