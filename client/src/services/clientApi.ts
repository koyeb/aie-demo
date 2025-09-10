import type { CreateUserSubmissionInput, SubmissionResponse } from '../types/schema';

// Client-side API service for photo submission
export const clientApi = {
  // Handle photo submission locally
  submitEmailAndPicture: {
    mutate: async (data: CreateUserSubmissionInput): Promise<SubmissionResponse> => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate the input (basic client-side validation)
      if (!data.email || !data.picture_data) {
        throw new Error('Email and picture are required');
      }
      
      // Return successful submission response
      return {
        success: true,
        message: `Thank you! Your photo submission has been received for email: ${data.email}`,
        submission_id: Math.floor(Math.random() * 10000)
      };
    }
  }
};