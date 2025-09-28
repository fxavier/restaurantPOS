import { S3Client } from '@aws-sdk/client-s3';

// AWS Configuration Interface
export interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string; // For local development with LocalStack or MinIO
}

// Legacy exports for backward compatibility
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const AWS_S3_BUCKET = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Get AWS configuration from environment variables
export const getAWSConfig = (): AWSConfig => {
  const config: AWSConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || '',
    endpoint: process.env.AWS_S3_ENDPOINT || undefined, // For LocalStack/MinIO
  };

  // Validate required configuration
  if (!config.accessKeyId) {
    throw new Error('AWS_ACCESS_KEY_ID is required');
  }
  
  if (!config.secretAccessKey) {
    throw new Error('AWS_SECRET_ACCESS_KEY is required');
  }
  
  if (!config.bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME is required');
  }

  return config;
};

// Create S3 Client instance
export const createS3Client = (): S3Client => {
  const config = getAWSConfig();
  
  const clientConfig: any = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  // Add custom endpoint for local development (LocalStack, MinIO, etc.)
  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true; // Required for LocalStack/MinIO
  }

  return new S3Client(clientConfig);
};

// S3 Client singleton
let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
};

// Helper function to generate S3 object key
export const generateS3Key = (
  folder: string, 
  filename: string, 
  restaurantId?: string
): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileExtension = filename.split('.').pop();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '');
  
  const basePath = restaurantId ? `restaurants/${restaurantId}` : 'general';
  
  return `${basePath}/${folder}/${timestamp}-${randomString}-${cleanFilename}`;
};

// Get public URL for S3 object
export const getS3ObjectUrl = (key: string): string => {
  const config = getAWSConfig();
  
  if (config.endpoint) {
    // For local development with custom endpoint
    return `${config.endpoint}/${config.bucketName}/${key}`;
  }
  
  // For AWS S3
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
};

// Environment validation
export const validateAWSEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!process.env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_ACCESS_KEY_ID environment variable is missing');
  }
  
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    errors.push('AWS_SECRET_ACCESS_KEY environment variable is missing');
  }
  
  if (!process.env.AWS_S3_BUCKET_NAME && !process.env.S3_BUCKET_NAME) {
    errors.push('AWS_S3_BUCKET_NAME environment variable is missing');
  }
  
  if (!process.env.AWS_REGION) {
    errors.push('AWS_REGION environment variable is missing (defaulting to us-east-1)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Debug logging (only on server)
if (typeof window === 'undefined') {
	console.log('AWS Environment Variables:', {
		region: AWS_REGION,
		bucket: AWS_S3_BUCKET ? 'Set' : 'Not Set',
		accessKey: AWS_ACCESS_KEY ? 'Set' : 'Not Set',
		secretKey: AWS_SECRET_KEY ? 'Set' : 'Not Set',
	});
}

// Validate required environment variables (only on server)
if (
	typeof window === 'undefined' &&
	(!AWS_S3_BUCKET || !AWS_ACCESS_KEY || !AWS_SECRET_KEY)
) {
	console.error('Missing required AWS environment variables');
}
