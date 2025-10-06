import {
  scenesResponseSchema,
  type CreateUserSubmissionInput,
  type SubmissionResponse,
  type ScenesResponse
} from '../types/schema';

// Get API base URL from environment variable, fallback to localhost
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

// Get authentication headers for admin requests
const getAuthHeaders = (): HeadersInit => {
  const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
  
  if (isAuthenticated) {
    // Create basic auth header using environment variables
    const username = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const password = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    const credentials = btoa(`${username}:${password}`);
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    };
  }
  
  return {
    'Content-Type': 'application/json',
  };
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
            original_data: data.picture_data,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: SubmissionResponse = { success: true };
        return result;
      } catch (error) {
        console.error('API request failed:', error);
        // Return a properly typed error response
        throw new Error(error instanceof Error ? error.message : 'Failed to submit data to API');
      }
    }
  },

  // Admin API methods
  admin: {
    // Get all scenes for admin review
    getScenes: async (): Promise<ScenesResponse> => {
      const apiBaseUrl = getApiBaseUrl();
      const endpoint = `${apiBaseUrl}/v1/admin/scenes`;

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Validate the response using the schema
        const validatedData = scenesResponseSchema.parse(data);
        return validatedData;
      } catch (error) {
        console.error('Failed to fetch scenes:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch scenes');
      }
    },

    // Approve a scene
    approveScene: async (sceneId: string): Promise<boolean> => {
      const apiBaseUrl = getApiBaseUrl();
      const endpoint = `${apiBaseUrl}/v1/admin/scene/${sceneId}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return true;
      } catch (error) {
        console.error('Failed to approve scene:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to approve scene');
      }
    }
  }
};
