import { Request, Response } from 'express';
import { StoryService } from '../services/storyService';
import { ApiResponse } from '@snappy/shared-types';

export class StoryController {
  // Create a new story
  static async createStory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const story = await StoryService.createStory(userId, req.body);

      const response: ApiResponse = {
        success: true,
        data: story,
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to create story',
        },
      };

      res.status(400).json(response);
    }
  }

  // Get story by ID
  static async getStoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const story = await StoryService.getStoryById(id || '', userId || undefined);

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

      const response: ApiResponse = {
        success: true,
        data: story,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get story',
        },
      };

      res.status(400).json(response);
    }
  }

  // Get story by unique ID (public access)
  static async getStoryByUniqueId(req: Request, res: Response) {
    try {
      const { uniqueId } = req.params;

      const story = await StoryService.getStoryByUniqueId(uniqueId || '');

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

      const response: ApiResponse = {
        success: true,
        data: story,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get story',
        },
      };

      res.status(400).json(response);
    }
  }

  // Get all stories for a user (admins see all stories)
  static async getUserStories(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Admins can see all stories
      const stories = userRole === 'admin'
        ? await StoryService.getAllStories()
        : await StoryService.getUserStories(userId);

      const response: ApiResponse = {
        success: true,
        data: stories,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get user stories',
        },
      };

      res.status(400).json(response);
    }
  }

  // Update story
  static async updateStory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Admins can update any story, regular users can only update their own
      const story = userRole === 'admin'
        ? await StoryService.updateStoryAsAdmin(id || '', req.body)
        : await StoryService.updateStory(id || '', userId || '', req.body);

      const response: ApiResponse = {
        success: true,
        data: story,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to update story',
        },
      };

      res.status(400).json(response);
    }
  }

  // Delete story
  static async deleteStory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Admins can delete any story, regular users can only delete their own
      if (userRole === 'admin') {
        await StoryService.deleteStoryAsAdmin(id || '');
      } else {
        await StoryService.deleteStory(id || '', userId || '');
      }

      const response: ApiResponse = {
        success: true,
        data: { message: 'Story deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to delete story',
        },
      };

      res.status(400).json(response);
    }
  }

  // Save complete story (from editor)
  static async saveCompleteStory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const storyData = req.body;

      const story = await StoryService.saveCompleteStory(userId, storyData);

      const response: ApiResponse = {
        success: true,
        data: story,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to save story',
        },
      };

      res.status(400).json(response);
    }
  }

  // Create story frame
  static async createStoryFrame(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user.id;

      const frame = await StoryService.createStoryFrame(storyId || '', userId || '', req.body);

      const response: ApiResponse = {
        success: true,
        data: frame,
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to create story frame',
        },
      };

      res.status(400).json(response);
    }
  }

  // Update story frame
  static async updateStoryFrame(req: Request, res: Response) {
    try {
      const { frameId } = req.params;
      const userId = (req as any).user.id;

      const frame = await StoryService.updateStoryFrame(frameId || '', userId || '', req.body);

      const response: ApiResponse = {
        success: true,
        data: frame,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to update story frame',
        },
      };

      res.status(400).json(response);
    }
  }

  // Delete story frame
  static async deleteStoryFrame(req: Request, res: Response) {
    try {
      const { frameId } = req.params;
      const userId = (req as any).user.id;

      await StoryService.deleteStoryFrame(frameId || '', userId || '');

      const response: ApiResponse = {
        success: true,
        data: { message: 'Story frame deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to delete story frame',
        },
      };

      res.status(400).json(response);
    }
  }

  // Create story element
  static async createStoryElement(req: Request, res: Response) {
    try {
      const { frameId } = req.params;
      const userId = (req as any).user.id;

      const element = await StoryService.createStoryElement(frameId || '', userId || '', req.body);

      const response: ApiResponse = {
        success: true,
        data: element,
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to create story element',
        },
      };

      res.status(400).json(response);
    }
  }

  // Update story element
  static async updateStoryElement(req: Request, res: Response) {
    try {
      const { elementId } = req.params;
      const userId = (req as any).user.id;

      const element = await StoryService.updateStoryElement(elementId || '', userId || '', req.body);

      const response: ApiResponse = {
        success: true,
        data: element,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to update story element',
        },
      };

      res.status(400).json(response);
    }
  }

  // Delete story element
  static async deleteStoryElement(req: Request, res: Response) {
    try {
      const { elementId } = req.params;
      const userId = (req as any).user.id;

      await StoryService.deleteStoryElement(elementId || '', userId || '');

      const response: ApiResponse = {
        success: true,
        data: { message: 'Story element deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to delete story element',
        },
      };

      res.status(400).json(response);
    }
  }

  // Create or update story background
  static async upsertStoryBackground(req: Request, res: Response) {
    try {
      const { frameId } = req.params;
      const userId = (req as any).user.id;

      const background = await StoryService.upsertStoryBackground(frameId || '', userId || '', req.body);

      const response: ApiResponse = {
        success: true,
        data: background,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to save story background',
        },
      };

      res.status(400).json(response);
    }
  }

  // Delete story background
  static async deleteStoryBackground(req: Request, res: Response) {
    try {
      const { frameId } = req.params;
      const userId = (req as any).user.id;

      await StoryService.deleteStoryBackground(frameId || '', userId || '');

      const response: ApiResponse = {
        success: true,
        data: { message: 'Story background deleted successfully' },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to delete story background',
        },
      };

      res.status(400).json(response);
    }
  }
}
