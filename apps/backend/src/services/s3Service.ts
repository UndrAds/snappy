import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env['AWS_REGION'] || 'us-east-1',
  credentials: {
    accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
  },
});

const BUCKET_NAME = process.env['S3_BUCKET_NAME']!;
const S3_BASE_URL = process.env['S3_BASE_URL']!;

export class S3Service {
  /**
   * Check if S3 is properly configured
   */
  static checkConfiguration(): { isValid: boolean; missingVars: string[] } {
    const requiredVars = [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'S3_BUCKET_NAME',
      'S3_BASE_URL',
    ];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    return {
      isValid: missingVars.length === 0,
      missingVars,
    };
  }

  /**
   * Upload a file to S3
   */
  static async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<{ key: string; url: string }> {
    // Check configuration first
    const configCheck = this.checkConfiguration();
    if (!configCheck.isValid) {
      throw new Error(
        `S3 configuration is incomplete. Missing environment variables: ${configCheck.missingVars.join(', ')}. Please check the S3_SETUP.md file for setup instructions.`
      );
    }

    try {
      // Generate unique filename
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      const key = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Note: ACL is removed as modern S3 buckets often have ACLs disabled
        // Public access should be configured via bucket policy instead
      });

      await s3Client.send(command);

      // Generate public URL
      const url = `${S3_BASE_URL}/${key}`;

      return { key, url };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload multiple files to S3
   */
  static async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads'
  ): Promise<Array<{ key: string; url: string }>> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('S3 multiple upload error:', error);
      throw new Error('Failed to upload files to S3');
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Extract S3 key from URL
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove leading slash and extract the key
      const key = pathname.substring(1);
      return key || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if URL is an S3 URL
   */
  static isS3Url(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('s3.amazonaws.com') ||
        urlObj.hostname.includes('.s3.') ||
        urlObj.hostname.includes('s3-')
      );
    } catch (error) {
      return false;
    }
  }
}
