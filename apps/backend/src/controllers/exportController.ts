import { Request, Response } from 'express';
import { ExportService, ExportOptions } from '../services/exportService';
import { StoryService } from '../services/storyService';
import { ApiResponse } from '@snappy/shared-types';
import * as fs from 'fs';

export class ExportController {
  /**
   * Export story to Google H5 Ads format
   */
  static async exportToH5Ads(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      const { exportType = 'standard' } = req.query;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!storyId) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story ID is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Resolve storyId (could be uniqueId or id)
      let story = null;
      // Try as uniqueId first (contains hyphens, typically longer)
      if (storyId.includes('-')) {
        story = await StoryService.getStoryByUniqueId(storyId);
        if (!story) {
          // Fallback to id
          story =
            userRole === 'admin'
              ? await StoryService.getStoryByIdAsAdmin(storyId)
              : await StoryService.getStoryById(storyId, userId || undefined);
        }
      } else {
        // Try as id
        story =
          userRole === 'admin'
            ? await StoryService.getStoryByIdAsAdmin(storyId)
            : await StoryService.getStoryById(storyId, userId || undefined);
      }

      if (!story) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Export options
      const options: ExportOptions = {
        exportType: exportType === 'app-campaigns' ? 'app-campaigns' : 'standard',
      };

      // Generate export
      const exportResult = await ExportService.exportToH5Ads(story, options);

      // Send ZIP file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${story.title.replace(/[^a-z0-9]/gi, '_')}_h5.zip"`
      );
      res.setHeader('Content-Length', exportResult.fileSize.toString());

      // Stream file
      const fileStream = fs.createReadStream(exportResult.zipPath);
      fileStream.pipe(res);

      // Cleanup after stream completes
      fileStream.on('close', () => {
        ExportService.cleanupExport(exportResult.zipPath);
      });

      fileStream.on('error', (error) => {
        console.error('Error streaming export file:', error);
        ExportService.cleanupExport(exportResult.zipPath);
        res.end();
      });

      res.on('close', () => {
        // Ensure cleanup even if client disconnects
        if (fs.existsSync(exportResult.zipPath)) {
          ExportService.cleanupExport(exportResult.zipPath);
        }
      });
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to export story',
        },
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get export preview/validation info
   */
  static async getExportInfo(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      const { exportType = 'standard' } = req.query;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!storyId) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story ID is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Resolve storyId (could be uniqueId or id)
      let story = null;
      // Try as uniqueId first (contains hyphens, typically longer)
      if (storyId.includes('-')) {
        story = await StoryService.getStoryByUniqueId(storyId);
        if (!story) {
          // Fallback to id
          story =
            userRole === 'admin'
              ? await StoryService.getStoryByIdAsAdmin(storyId)
              : await StoryService.getStoryById(storyId, userId || undefined);
        }
      } else {
        // Try as id
        story =
          userRole === 'admin'
            ? await StoryService.getStoryByIdAsAdmin(storyId)
            : await StoryService.getStoryById(storyId, userId || undefined);
      }

      if (!story) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Count story frames (excluding ads)
      const storyFrames = (story.frames || []).filter((f) => f.type === 'story');
      const imageCount = this.countImages(story, storyFrames);

      const maxSize = exportType === 'app-campaigns' ? 5 * 1024 * 1024 : 600 * 1024;
      const maxFiles = exportType === 'app-campaigns' ? 512 : 40;
      const estimatedFiles = 1 + imageCount; // HTML + images (CSS and JS are inlined)

      const response: ApiResponse = {
        success: true,
        data: {
          storyFrames: storyFrames.length,
          imageCount,
          estimatedFiles,
          maxSize,
          maxFiles,
          constraints: {
            fileSize: {
              limit: maxSize,
              limitKB: Math.round(maxSize / 1024),
            },
            fileCount: {
              limit: maxFiles,
              estimated: estimatedFiles,
            },
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get export info',
        },
      };
      res.status(500).json(response);
    }
  }

  /**
   * Count images in story
   */
  private static countImages(story: any, frames: any[]): number {
    const imageUrls = new Set<string>();

    if (story.publisherPic) {
      imageUrls.add(story.publisherPic);
    }

    frames.forEach((frame) => {
      if (frame.background?.type === 'image' && frame.background.value) {
        imageUrls.add(frame.background.value);
      }
      frame.elements?.forEach((element: any) => {
        if (element.type === 'image' && element.mediaUrl) {
          imageUrls.add(element.mediaUrl);
        }
      });
    });

    return imageUrls.size;
  }
}
