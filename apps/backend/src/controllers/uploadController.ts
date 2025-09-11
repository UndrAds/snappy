import { Request, Response } from 'express';
import {
  uploadSingle,
  uploadMultiple,
  uploadFileToS3,
  uploadMultipleFilesToS3,
} from '../services/uploadService';
import { ApiResponse } from '@snappy/shared-types';

export class UploadController {
  // Upload single file
  static async uploadSingle(req: Request, res: Response) {
    uploadSingle(req, res, async (err) => {
      try {
        if (err) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: err.message || 'File upload failed',
            },
          };
          res.status(400).json(response);
          return;
        }

        if (!req.file) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'No file uploaded',
            },
          };
          res.status(400).json(response);
          return;
        }

        // Upload to S3
        const { key, url } = await uploadFileToS3(req.file);

        const response: ApiResponse = {
          success: true,
          data: {
            filename: key,
            originalName: req.file.originalname,
            size: req.file.size,
            url: url,
          },
        };

        res.status(200).json(response);
      } catch (error: any) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: error.message || 'File upload failed',
          },
        };

        res.status(500).json(response);
      }
    });
  }

  // Upload multiple files
  static async uploadMultiple(req: Request, res: Response) {
    uploadMultiple(req, res, async (err) => {
      try {
        if (err) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: err.message || 'File upload failed',
            },
          };
          res.status(400).json(response);
          return;
        }

        if (!req.files || req.files.length === 0) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'No files uploaded',
            },
          };
          res.status(400).json(response);
          return;
        }

        // Upload all files to S3
        const uploadResults = await uploadMultipleFilesToS3(req.files as Express.Multer.File[]);

        const files = uploadResults.map((result, index) => {
          const file = (req.files as Express.Multer.File[])[index];
          return {
            filename: result.key,
            originalName: file?.originalname || 'unknown',
            size: file?.size || 0,
            url: result.url,
          };
        });

        const response: ApiResponse = {
          success: true,
          data: files,
        };

        res.status(200).json(response);
      } catch (error: any) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: error.message || 'File upload failed',
          },
        };

        res.status(500).json(response);
      }
    });
  }
}
