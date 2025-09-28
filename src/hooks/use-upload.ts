import { useState } from 'react';
import { toast } from 'sonner';

interface UploadOptions {
  uploadType: 'product' | 'logo' | 'avatar' | 'menu' | 'document';
  restaurantId?: string;
  onSuccess?: (imageUrl: string, fileInfo: any) => void;
  onError?: (error: string) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = async (file: File, options: UploadOptions) => {
    const { uploadType, restaurantId, onSuccess, onError } = options;

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', uploadType);
      
      if (restaurantId) {
        formData.append('restaurantId', restaurantId);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro no upload');
      }

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
      });

      toast.success('Arquivo enviado com sucesso!');
      
      if (onSuccess && result.file) {
        onSuccess(result.file.url, result.file);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
      
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });

      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }

      throw error;
    }
  };

  const uploadProductImage = async (
    file: File, 
    restaurantId?: string,
    callbacks?: {
      onSuccess?: (imageUrl: string, fileInfo: any) => void;
      onError?: (error: string) => void;
    }
  ) => {
    return uploadFile(file, {
      uploadType: 'product',
      restaurantId,
      ...callbacks,
    });
  };

  const uploadRestaurantLogo = async (
    file: File, 
    restaurantId?: string,
    callbacks?: {
      onSuccess?: (imageUrl: string, fileInfo: any) => void;
      onError?: (error: string) => void;
    }
  ) => {
    return uploadFile(file, {
      uploadType: 'logo',
      restaurantId,
      ...callbacks,
    });
  };

  const uploadUserAvatar = async (
    file: File, 
    restaurantId?: string,
    callbacks?: {
      onSuccess?: (imageUrl: string, fileInfo: any) => void;
      onError?: (error: string) => void;
    }
  ) => {
    return uploadFile(file, {
      uploadType: 'avatar',
      restaurantId,
      ...callbacks,
    });
  };

  const deleteFile = async (fileKey: string) => {
    try {
      const response = await fetch(`/api/upload?key=${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir arquivo');
      }

      toast.success('Arquivo excluído com sucesso!');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir arquivo';
      toast.error(errorMessage);
      throw error;
    }
  };

  const reset = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
    });
  };

  return {
    uploadState,
    uploadFile,
    uploadProductImage,
    uploadRestaurantLogo,
    uploadUserAvatar,
    deleteFile,
    reset,
    isUploading: uploadState.isUploading,
    progress: uploadState.progress,
    error: uploadState.error,
  };
}