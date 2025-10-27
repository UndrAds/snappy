import { Request, Response } from 'express';
import { StoryService } from '../services/storyService';
import { RSSService } from '../services/rssService';
import { SchedulerService } from '../services/schedulerService';
import { ApiResponse } from '@snappy/shared-types';

export class RSSController {
  // Validate RSS feed URL
  static async validateFeedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { feedUrl } = req.body;

      if (!feedUrl) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Feed URL is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      const rssService = new RSSService();
      const isValid = await rssService.validateFeedUrl(feedUrl);

      const response: ApiResponse = {
        success: true,
        data: { isValid },
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to validate feed URL',
        },
      };

      res.status(400).json(response);
    }
  }

  // Get RSS processing status
  static async getProcessingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user.id;

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

      // Verify story belongs to user
      const story = await StoryService.getStoryById(storyId, userId);
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

      const schedulerService = new SchedulerService();
      const status = await schedulerService.getProcessingStatus(storyId);

      const response: ApiResponse = {
        success: true,
        data: status,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get processing status',
        },
      };

      res.status(400).json(response);
    }
  }

  // Update RSS configuration
  static async updateRSSConfig(req: Request, res: Response): Promise<void> {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user.id;

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
      const { rssConfig } = req.body;

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

      // Verify story belongs to user
      const story = await StoryService.getStoryById(storyId, userId);
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

      if (story.storyType !== 'dynamic') {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story is not a dynamic story',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Validate RSS configuration
      const isValidConfig = await StoryService.validateRSSConfig(rssConfig);
      if (!isValidConfig) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Invalid RSS configuration',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Cancel existing RSS updates
      const schedulerService1 = new SchedulerService();
      await schedulerService1.cancelRSSUpdates(storyId);

      // Update story with new RSS configuration
      const updatedStory = await StoryService.updateStory(storyId, userId, {
        rssConfig: {
          ...rssConfig,
          isActive: true,
          lastUpdated: new Date().toISOString(),
          nextUpdate: new RSSService()
            .getNextUpdateTime(rssConfig.updateIntervalMinutes)
            .toISOString(),
        },
      });

      // Schedule new RSS updates
      const schedulerService2 = new SchedulerService();
      await schedulerService2.scheduleRSSUpdate(storyId, updatedStory.rssConfig!);

      const response: ApiResponse = {
        success: true,
        data: updatedStory,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to update RSS configuration',
        },
      };

      res.status(400).json(response);
    }
  }

  // Toggle RSS updates on/off
  static async toggleRSSUpdates(req: Request, res: Response): Promise<void> {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user.id;

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
      const { isActive } = req.body;

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

      // Verify story belongs to user
      const story = await StoryService.getStoryById(storyId, userId);
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

      if (story.storyType !== 'dynamic' || !story.rssConfig) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story is not a dynamic story with RSS configuration',
          },
        };
        res.status(400).json(response);
        return;
      }

      const updatedRssConfig = {
        ...story.rssConfig,
        isActive,
      };

      if (isActive) {
        // Schedule RSS updates
        const schedulerService = new SchedulerService();
        await schedulerService.scheduleRSSUpdate(storyId, updatedRssConfig);
      } else {
        // Cancel RSS updates
        const schedulerService1 = new SchedulerService();
        await schedulerService1.cancelRSSUpdates(storyId);
      }

      // Update story
      const updatedStory = await StoryService.updateStory(storyId, userId, {
        rssConfig: updatedRssConfig,
      });

      const response: ApiResponse = {
        success: true,
        data: updatedStory,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to toggle RSS updates',
        },
      };

      res.status(400).json(response);
    }
  }

  // Manually trigger RSS update
  static async triggerRSSUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user.id;

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

      // Verify story belongs to user
      const story = await StoryService.getStoryById(storyId, userId);
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

      if (story.storyType !== 'dynamic' || !story.rssConfig) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Story is not a dynamic story with RSS configuration',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Trigger immediate RSS update
      const schedulerService3 = new SchedulerService();
      await schedulerService3.scheduleRSSUpdate(storyId, story.rssConfig);

      const response: ApiResponse = {
        success: true,
        data: { message: 'RSS update triggered successfully' },
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to trigger RSS update',
        },
      };

      res.status(400).json(response);
    }
  }

  // Get queue statistics
  static async getQueueStats(_req: Request, res: Response): Promise<void> {
    try {
      const schedulerService4 = new SchedulerService();
      const stats = await schedulerService4.getQueueStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get queue statistics',
        },
      };

      res.status(400).json(response);
    }
  }
}
