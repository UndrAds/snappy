import { Request, Response } from 'express';
import { uploadSingle, uploadMultiple, getFileUrl } from '../services/uploadService';
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
          return res.status(400).json(response);
        }

        if (!req.file) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'No file uploaded',
            },
          };
          return res.status(400).json(response);
        }

        const fileUrl = getFileUrl(req.file.filename);

        const response: ApiResponse = {
          success: true,
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            url: fileUrl,
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
          return res.status(400).json(response);
        }

        if (!req.files || req.files.length === 0) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'No files uploaded',
            },
          };
          return res.status(400).json(response);
        }

        const files = (req.files as Express.Multer.File[]).map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: getFileUrl(file.filename),
        }));

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
