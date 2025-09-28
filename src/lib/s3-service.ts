import {
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	CopyObjectCommand,
	GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	getS3Client,
	getAWSConfig,
	generateS3Key,
	getS3ObjectUrl,
} from './aws-config';

// File upload options
export interface UploadOptions {
	folder?: string;
	restaurantId?: string;
	contentType?: string;
	metadata?: Record<string, string>;
}

// File information interface
export interface FileInfo {
	key: string;
	url: string;
	bucket: string;
	size?: number;
	contentType?: string;
	lastModified?: Date;
	metadata?: Record<string, string>;
}

// Upload result interface
export interface UploadResult {
	success: boolean;
	file?: FileInfo;
	error?: string;
}

// List files options
export interface ListFilesOptions {
	prefix?: string;
	maxKeys?: number;
	startAfter?: string;
}

export class S3Service {
	private s3Client;
	private config;

	constructor() {
		this.s3Client = getS3Client();
		this.config = getAWSConfig();
	}

	/**
	 * Upload a file to S3
	 *
	 * Note: This service no longer sets ACLs on uploaded objects for better security.
	 * To make objects publicly accessible, configure your S3 bucket with a bucket policy:
	 *
	 * {
	 *   "Version": "2012-10-17",
	 *   "Statement": [
	 *     {
	 *       "Sid": "PublicReadGetObject",
	 *       "Effect": "Allow",
	 *       "Principal": "*",
	 *       "Action": "s3:GetObject",
	 *       "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
	 *     }
	 *   ]
	 * }
	 */
	async uploadFile(
		file: Buffer | Uint8Array | string,
		filename: string,
		options: UploadOptions = {}
	): Promise<UploadResult> {
		try {
			const {
				folder = 'uploads',
				restaurantId,
				contentType = 'application/octet-stream',
				metadata = {},
			} = options;

			const key = generateS3Key(folder, filename, restaurantId);

			const command = new PutObjectCommand({
				Bucket: this.config.bucketName,
				Key: key,
				Body: file,
				ContentType: contentType,
				Metadata: {
					...metadata,
					uploadedAt: new Date().toISOString(),
					restaurantId: restaurantId || 'general',
				},
			});

			await this.s3Client.send(command);

			const fileInfo: FileInfo = {
				key,
				url: getS3ObjectUrl(key),
				bucket: this.config.bucketName,
				contentType,
				metadata: {
					...metadata,
					uploadedAt: new Date().toISOString(),
					restaurantId: restaurantId || 'general',
				},
			};

			return {
				success: true,
				file: fileInfo,
			};
		} catch (error) {
			console.error('Error uploading file to S3:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown upload error',
			};
		}
	}

	/**
	 * Upload an image file with optimization
	 */
	async uploadImage(
		file: Buffer | Uint8Array,
		filename: string,
		options: UploadOptions = {}
	): Promise<UploadResult> {
		const imageOptions = {
			...options,
			folder: options.folder || 'images',
			contentType: this.getImageContentType(filename),
		};

		return this.uploadFile(file, filename, imageOptions);
	}

	/**
	 * Get file information
	 */
	async getFileInfo(key: string): Promise<FileInfo | null> {
		try {
			const command = new HeadObjectCommand({
				Bucket: this.config.bucketName,
				Key: key,
			});

			const response = await this.s3Client.send(command);

			return {
				key,
				url: getS3ObjectUrl(key),
				bucket: this.config.bucketName,
				size: response.ContentLength,
				contentType: response.ContentType,
				lastModified: response.LastModified,
				metadata: response.Metadata,
			};
		} catch (error) {
			console.error('Error getting file info:', error);
			return null;
		}
	}

	/**
	 * Download file from S3
	 */
	async downloadFile(key: string): Promise<Buffer | null> {
		try {
			const command = new GetObjectCommand({
				Bucket: this.config.bucketName,
				Key: key,
			});

			const response = await this.s3Client.send(command);

			if (response.Body) {
				const chunks: Uint8Array[] = [];
				const reader = response.Body as any;

				for await (const chunk of reader) {
					chunks.push(chunk);
				}

				return Buffer.concat(chunks);
			}

			return null;
		} catch (error) {
			console.error('Error downloading file from S3:', error);
			return null;
		}
	}

	/**
	 * Delete file from S3
	 */
	async deleteFile(key: string): Promise<boolean> {
		try {
			const command = new DeleteObjectCommand({
				Bucket: this.config.bucketName,
				Key: key,
			});

			await this.s3Client.send(command);
			return true;
		} catch (error) {
			console.error('Error deleting file from S3:', error);
			return false;
		}
	}

	/**
	 * Copy file within S3
	 */
	async copyFile(sourceKey: string, destinationKey: string): Promise<boolean> {
		try {
			const command = new CopyObjectCommand({
				Bucket: this.config.bucketName,
				CopySource: `${this.config.bucketName}/${sourceKey}`,
				Key: destinationKey,
			});

			await this.s3Client.send(command);
			return true;
		} catch (error) {
			console.error('Error copying file in S3:', error);
			return false;
		}
	}

	/**
	 * List files in S3 bucket
	 */
	async listFiles(options: ListFilesOptions = {}): Promise<FileInfo[]> {
		try {
			const { prefix, maxKeys = 1000, startAfter } = options;

			const command = new ListObjectsV2Command({
				Bucket: this.config.bucketName,
				Prefix: prefix,
				MaxKeys: maxKeys,
				StartAfter: startAfter,
			});

			const response = await this.s3Client.send(command);

			if (!response.Contents) {
				return [];
			}

			return response.Contents.map((object) => ({
				key: object.Key!,
				url: getS3ObjectUrl(object.Key!),
				bucket: this.config.bucketName,
				size: object.Size,
				lastModified: object.LastModified,
			}));
		} catch (error) {
			console.error('Error listing files from S3:', error);
			return [];
		}
	}

	/**
	 * Generate presigned URL for secure access
	 */
	async generatePresignedUrl(
		key: string,
		operation: 'getObject' | 'putObject' = 'getObject',
		expiresIn: number = 3600
	): Promise<string | null> {
		try {
			let command;

			if (operation === 'getObject') {
				command = new GetObjectCommand({
					Bucket: this.config.bucketName,
					Key: key,
				});
			} else {
				command = new PutObjectCommand({
					Bucket: this.config.bucketName,
					Key: key,
				});
			}

			return await getSignedUrl(this.s3Client, command, { expiresIn });
		} catch (error) {
			console.error('Error generating presigned URL:', error);
			return null;
		}
	}

	/**
	 * Check if file exists
	 */
	async fileExists(key: string): Promise<boolean> {
		try {
			const command = new HeadObjectCommand({
				Bucket: this.config.bucketName,
				Key: key,
			});

			await this.s3Client.send(command);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get files by restaurant ID
	 */
	async getRestaurantFiles(
		restaurantId: string,
		folder?: string
	): Promise<FileInfo[]> {
		const prefix = folder
			? `restaurants/${restaurantId}/${folder}/`
			: `restaurants/${restaurantId}/`;

		return this.listFiles({ prefix });
	}

	/**
	 * Delete all files for a restaurant
	 */
	async deleteRestaurantFiles(restaurantId: string): Promise<boolean> {
		try {
			const files = await this.getRestaurantFiles(restaurantId);

			const deletePromises = files.map((file) => this.deleteFile(file.key));
			const results = await Promise.all(deletePromises);

			return results.every((result) => result === true);
		} catch (error) {
			console.error('Error deleting restaurant files:', error);
			return false;
		}
	}

	/**
	 * Get image content type from filename
	 */
	private getImageContentType(filename: string): string {
		const extension = filename.split('.').pop()?.toLowerCase();

		switch (extension) {
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg';
			case 'png':
				return 'image/png';
			case 'gif':
				return 'image/gif';
			case 'webp':
				return 'image/webp';
			case 'svg':
				return 'image/svg+xml';
			default:
				return 'image/jpeg';
		}
	}
}

// Export singleton instance
export const s3Service = new S3Service();
