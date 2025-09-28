// Upload result interface
export interface UploadResult {
	success: boolean;
	url?: string;
	key?: string;
	error?: string;
}

// File validation interface
export interface FileValidation {
	valid: boolean;
	error?: string;
}

// Upload configuration
export interface UploadConfig {
	maxFileSize: number; // in bytes
	allowedTypes: readonly string[];
	allowedExtensions: readonly string[];
	folder: string;
	generateThumbnail?: boolean;
	compressImages?: boolean;
}

// Predefined upload configurations
export const UPLOAD_CONFIGS = {
	PRODUCT_IMAGES: {
		maxFileSize: 5 * 1024 * 1024, // 5MB
		allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
		allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
		folder: 'products',
		generateThumbnail: true,
		compressImages: true,
	},
	RESTAURANT_LOGOS: {
		maxFileSize: 2 * 1024 * 1024, // 2MB
		allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
		allowedExtensions: ['.jpg', '.jpeg', '.png', '.svg'],
		folder: 'logos',
		generateThumbnail: false,
		compressImages: true,
	},
	USER_AVATARS: {
		maxFileSize: 1 * 1024 * 1024, // 1MB
		allowedTypes: ['image/jpeg', 'image/png'],
		allowedExtensions: ['.jpg', '.jpeg', '.png'],
		folder: 'avatars',
		generateThumbnail: true,
		compressImages: true,
	},
	MENU_IMAGES: {
		maxFileSize: 3 * 1024 * 1024, // 3MB
		allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
		allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
		folder: 'menus',
		generateThumbnail: true,
		compressImages: true,
	},
	DOCUMENTS: {
		maxFileSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		],
		allowedExtensions: ['.pdf', '.doc', '.docx'],
		folder: 'documents',
		generateThumbnail: false,
		compressImages: false,
	},
} as const;

export class UploadService {
	/**
	 * Validate file before upload
	 */
	static validateFile(file: File, config: UploadConfig): FileValidation {
		// Check file size
		if (file.size > config.maxFileSize) {
			return {
				valid: false,
				error: `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(
					config.maxFileSize
				)}`,
			};
		}

		// Check file type
		if (!config.allowedTypes.some((type) => type === file.type)) {
			return {
				valid: false,
				error: `Tipo de arquivo não permitido. Tipos aceitos: ${config.allowedTypes.join(
					', '
				)}`,
			};
		}

		// Check file extension
		const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
		if (!config.allowedExtensions.includes(fileExtension)) {
			return {
				valid: false,
				error: `Extensão de arquivo não permitida. Extensões aceitas: ${config.allowedExtensions.join(
					', '
				)}`,
			};
		}

		return { valid: true };
	}

	/**
	 * Upload file with validation using API endpoint (client-side only)
	 */
	static async uploadFile(
		file: File,
		config: UploadConfig,
		restaurantId?: string
	): Promise<UploadResult> {
		// Check if we're running in browser environment
		if (typeof window === 'undefined') {
			return {
				success: false,
				error:
					'Upload service can only be used on the client side. Use s3Service directly on the server.',
			};
		}

		// Validate file
		const validation = this.validateFile(file, config);
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			};
		}

		try {
			// Create form data
			const formData = new FormData();
			formData.append('file', file);
			formData.append(
				'uploadType',
				config.folder === 'products' ? 'product' : config.folder
			);

			if (restaurantId) {
				formData.append('restaurantId', restaurantId);
			}

			// Upload via API
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Erro no upload',
				};
			}

			return {
				success: true,
				url: result.file?.url,
				key: result.file?.key,
			};
		} catch (error) {
			console.error('Error in upload service:', error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: 'Erro desconhecido no upload',
			};
		}
	}

	/**
	 * Upload product image
	 */
	static async uploadProductImage(
		file: File,
		restaurantId?: string
	): Promise<UploadResult> {
		return this.uploadFile(file, UPLOAD_CONFIGS.PRODUCT_IMAGES, restaurantId);
	}

	/**
	 * Upload restaurant logo
	 */
	static async uploadRestaurantLogo(
		file: File,
		restaurantId?: string
	): Promise<UploadResult> {
		return this.uploadFile(file, UPLOAD_CONFIGS.RESTAURANT_LOGOS, restaurantId);
	}

	/**
	 * Upload user avatar
	 */
	static async uploadUserAvatar(
		file: File,
		_userId: string,
		restaurantId?: string
	): Promise<UploadResult> {
		// For user avatars, we'll handle the userId metadata on the server side
		// The upload service only handles basic file uploads and validation
		return this.uploadFile(file, UPLOAD_CONFIGS.USER_AVATARS, restaurantId);
	}

	/**
	 * Upload menu image
	 */
	static async uploadMenuImage(
		file: File,
		restaurantId?: string
	): Promise<UploadResult> {
		return this.uploadFile(file, UPLOAD_CONFIGS.MENU_IMAGES, restaurantId);
	}

	/**
	 * Upload document
	 */
	static async uploadDocument(
		file: File,
		restaurantId?: string,
		_documentType?: string
	): Promise<UploadResult> {
		// For documents, we'll handle the documentType metadata on the server side
		// The upload service only handles basic file uploads and validation
		return this.uploadFile(file, UPLOAD_CONFIGS.DOCUMENTS, restaurantId);
	}

	/**
	 * Upload multiple files
	 */
	static async uploadMultipleFiles(
		files: File[],
		config: UploadConfig,
		restaurantId?: string,
		onProgress?: (progress: number, currentFile: string) => void
	): Promise<UploadResult[]> {
		const results: UploadResult[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (onProgress) {
				onProgress((i / files.length) * 100, file.name);
			}

			const result = await this.uploadFile(file, config, restaurantId);
			results.push(result);
		}

		if (onProgress) {
			onProgress(100, 'Concluído');
		}

		return results;
	}

	/**
	 * Delete uploaded file (client-side only)
	 */
	static async deleteFile(fileKey: string): Promise<boolean> {
		// Check if we're running in browser environment
		if (typeof window === 'undefined') {
			console.warn(
				'Delete file can only be used on the client side. Use s3Service directly on the server.'
			);
			return false;
		}

		try {
			const response = await fetch(
				`/api/upload?key=${encodeURIComponent(fileKey)}`,
				{
					method: 'DELETE',
				}
			);

			const result = await response.json();
			return response.ok && result.success;
		} catch (error) {
			console.error('Error deleting file:', error);
			return false;
		}
	}

	/**
	 * Get file info (placeholder - implement if needed)
	 */
	static async getFileInfo(_fileKey: string) {
		// This would need a corresponding API endpoint
		console.warn('getFileInfo not implemented via API');
		return null;
	}

	/**
	 * Check if file exists (placeholder - implement if needed)
	 */
	static async fileExists(_fileKey: string): Promise<boolean> {
		// This would need a corresponding API endpoint
		console.warn('fileExists not implemented via API');
		return false;
	}

	/**
	 * Generate presigned URL for secure access (placeholder - implement if needed)
	 */
	static async generatePresignedUrl(
		_fileKey: string,
		_expiresIn: number = 3600
	): Promise<string | null> {
		// This would need a corresponding API endpoint
		console.warn('generatePresignedUrl not implemented via API');
		return null;
	}

	/**
	 * Format file size in human readable format
	 */
	static formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Extract file extension from filename
	 */
	static getFileExtension(filename: string): string {
		return '.' + filename.split('.').pop()?.toLowerCase() || '';
	}

	/**
	 * Generate safe filename
	 */
	static generateSafeFilename(originalName: string): string {
		const extension = this.getFileExtension(originalName);
		const nameWithoutExt = originalName.replace(extension, '');
		const safeName = nameWithoutExt
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');

		return `${safeName}${extension}`;
	}

	/**
	 * Create thumbnail filename
	 */
	static createThumbnailFilename(
		originalFilename: string,
		size: string = 'thumb'
	): string {
		const extension = this.getFileExtension(originalFilename);
		const nameWithoutExt = originalFilename.replace(extension, '');

		return `${nameWithoutExt}_${size}${extension}`;
	}

	/**
	 * Validate image dimensions (requires canvas or image processing library)
	 */
	static async validateImageDimensions(
		file: File,
		maxWidth?: number,
		maxHeight?: number,
		minWidth?: number,
		minHeight?: number
	): Promise<FileValidation> {
		return new Promise((resolve) => {
			const img = new Image();
			const url = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(url);

				const { width, height } = img;

				if (maxWidth && width > maxWidth) {
					resolve({
						valid: false,
						error: `Largura da imagem deve ser no máximo ${maxWidth}px. Atual: ${width}px`,
					});
					return;
				}

				if (maxHeight && height > maxHeight) {
					resolve({
						valid: false,
						error: `Altura da imagem deve ser no máximo ${maxHeight}px. Atual: ${height}px`,
					});
					return;
				}

				if (minWidth && width < minWidth) {
					resolve({
						valid: false,
						error: `Largura da imagem deve ser no mínimo ${minWidth}px. Atual: ${width}px`,
					});
					return;
				}

				if (minHeight && height < minHeight) {
					resolve({
						valid: false,
						error: `Altura da imagem deve ser no mínimo ${minHeight}px. Atual: ${height}px`,
					});
					return;
				}

				resolve({ valid: true });
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve({
					valid: false,
					error: 'Não foi possível carregar a imagem',
				});
			};

			img.src = url;
		});
	}
}

// Export singleton service
export const uploadService = UploadService;
