import request from 'supertest';
import app from '../index';
import path from 'path';
import fs from 'fs';

describe('Upload Endpoints', () => {
  // Mock S3 service for testing
  beforeAll(() => {
    // Set test environment variables
    process.env['AWS_REGION'] = 'us-east-1';
    process.env['AWS_ACCESS_KEY_ID'] = 'test-key';
    process.env['AWS_SECRET_ACCESS_KEY'] = 'test-secret';
    process.env['S3_BUCKET_NAME'] = 'test-bucket';
    process.env['S3_BASE_URL'] = 'https://test-bucket.s3.amazonaws.com';
  });

  describe('POST /api/uploads/single', () => {
    it('should upload a single file to S3', async () => {
      // Create a test image file
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      const testImageBuffer = Buffer.from('fake-image-data');
      fs.writeFileSync(testImagePath, testImageBuffer);

      const res = await request(app).post('/api/uploads/single').attach('image', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('filename');
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data.url).toContain('https://test-bucket.s3.amazonaws.com');

      // Clean up
      fs.unlinkSync(testImagePath);
    });

    it('should return 400 if no file is uploaded', async () => {
      const res = await request(app).post('/api/uploads/single');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('No file uploaded');
    });

    it('should return 400 for invalid file type', async () => {
      // Create a test text file
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'test content');

      const res = await request(app).post('/api/uploads/single').attach('image', testFilePath);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid file type');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('POST /api/uploads/multiple', () => {
    it('should upload multiple files to S3', async () => {
      // Create test image files
      const testImage1Path = path.join(__dirname, 'test-image1.jpg');
      const testImage2Path = path.join(__dirname, 'test-image2.jpg');
      const testImageBuffer = Buffer.from('fake-image-data');

      fs.writeFileSync(testImage1Path, testImageBuffer);
      fs.writeFileSync(testImage2Path, testImageBuffer);

      const res = await request(app)
        .post('/api/uploads/multiple')
        .attach('images', testImage1Path)
        .attach('images', testImage2Path);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('url');
      expect(res.body.data[1]).toHaveProperty('url');

      // Clean up
      fs.unlinkSync(testImage1Path);
      fs.unlinkSync(testImage2Path);
    });

    it('should return 400 if no files are uploaded', async () => {
      const res = await request(app).post('/api/uploads/multiple');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('No files uploaded');
    });
  });
});
