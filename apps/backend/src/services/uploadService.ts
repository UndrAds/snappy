import multer from 'multer';
import { S3Service } from './s3Service';

// Configure multer to store files in memory for S3 upload
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload middleware for single file
export const uploadSingle = upload.single('image');

// Upload middleware for multiple files
export const uploadMultiple = upload.array('images', 10);

// Upload file to S3 and return URL
export const uploadFileToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<{ key: string; url: string }> => {
  return await S3Service.uploadFile(file, folder);
};

// Upload multiple files to S3
export const uploadMultipleFilesToS3 = async (
  files: Express.Multer.File[],
  folder: string = 'uploads'
): Promise<Array<{ key: string; url: string }>> => {
  return await S3Service.uploadMultipleFiles(files, folder);
};

// Delete file from S3
export const deleteFileFromS3 = async (url: string): Promise<void> => {
  const key = S3Service.extractKeyFromUrl(url);
  if (key) {
    await S3Service.deleteFile(key);
  }
};

// Extract S3 key from URL
export const extractKeyFromUrl = (url: string): string | null => {
  return S3Service.extractKeyFromUrl(url);
};

// Check if URL is an S3 URL
export const isS3Url = (url: string): boolean => {
  return S3Service.isS3Url(url);
};
