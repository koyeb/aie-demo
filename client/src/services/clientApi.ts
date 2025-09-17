import type { CreateUserSubmissionInput, SubmissionResponse } from '../types/schema';

// Get API base URL from environment variable, fallback to localhost
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

// Client-side API service for photo submission
export const clientApi = {
  // Handle photo submission to API endpoint
  submitEmailAndPicture: {
    mutate: async (data: CreateUserSubmissionInput): Promise<SubmissionResponse> => {
      // Validate the input (basic client-side validation)
      if (!data.name || !data.email || !data.picture_data) {
        throw new Error('Name, email and picture are required');
      }
      
      const apiBaseUrl = getApiBaseUrl();
      const endpoint = `${apiBaseUrl}/v1/scene`;
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            picture_data: data.picture_data,
            picture_filename: data.picture_filename,
            picture_mime_type: data.picture_mime_type,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: SubmissionResponse = await response.json();
        return result;
      } catch (error) {
        console.error('API request failed:', error);
        // Return a properly typed error response
        throw new Error(error instanceof Error ? error.message : 'Failed to submit data to API');
      }
    }
  }
};