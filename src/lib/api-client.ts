interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

class ApiError extends Error {
  constructor(public status: number, public errorMessage: string, public errorCode?: string) {
    super(errorMessage);
    this.name = 'ApiError';
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(response.status, result.errorMessage || 'API request failed', result.errorCode || '');
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('API request error:', error);
    throw new ApiError(500, 'Network error or invalid response');
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),

  // Image upload methods
  uploadImage: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/produtos/upload-imagem', {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<{ url: string; filename: string; size: number }> = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(response.status, result.errorMessage || 'Upload failed', result.errorCode || '');
    }

    return result.data as { url: string; filename: string; size: number };
  },

  updateProductImage: async (productId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/produtos/${productId}/imagem`, {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(response.status, result.errorMessage || 'Image update failed', result.errorCode || '');
    }

    return result.data;
  },

  deleteProductImage: (productId: string) =>
    apiRequest(`/produtos/${productId}/imagem`, { method: 'DELETE' }),

  deleteUploadedImage: (imageUrl: string) =>
    apiRequest(`/produtos/upload-imagem?url=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse };