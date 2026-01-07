import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { ApiResponse } from '@snappy/shared-types';
import prisma from '../config/database';

export class AnalyticsController {
  /**
   * POST /api/analytics/track
   * Track an analytics event (public endpoint)
   */
  static async trackEvent(req: Request, res: Response) {
    try {
      const { storyId, eventType, frameIndex, value, sessionId, metadata } = req.body;

      // Validate required fields
      if (!storyId || !eventType) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'storyId and eventType are required',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Validate eventType
      const validEventTypes = ['story_view', 'frame_view', 'ad_impression', 'time_spent', 'story_complete'];
      if (!validEventTypes.includes(eventType)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }

      await AnalyticsService.trackEvent({
        storyId,
        eventType,
        frameIndex,
        value,
        sessionId,
        metadata,
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Event tracked successfully' },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to track event',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/analytics/:storyId
   * Get analytics for a specific story (protected endpoint)
   */
  static async getStoryAnalytics(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user?.id;

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

      // Verify user owns the story (optional - can be removed if analytics should be public)
      // For now, we'll allow any authenticated user to view analytics
      // You can add ownership check here if needed

      const analytics = await AnalyticsService.getStoryAnalytics(storyId);

      const response: ApiResponse = {
        success: true,
        data: analytics,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get analytics',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/analytics
   * Get analytics for all stories owned by the user (protected endpoint)
   * Admins can see analytics for all stories
   */
  static async getUserStoriesAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'User not authenticated',
          },
        };
        res.status(401).json(response);
        return;
      }

      // If admin, get analytics for all stories
      if (userRole === 'admin') {
        const allStories = await prisma.story.findMany({
          include: {
            analytics: true,
          },
        });

        const analytics = allStories.map((story: any) => ({
          storyId: story.id,
          views: story.analytics?.views ?? 0,
          avgPostsSeen: story.analytics?.avgPostsSeen ?? 0,
          avgTimeSpent: story.analytics?.avgTimeSpent ?? 0,
          avgAdsSeen: story.analytics?.avgAdsSeen ?? 0,
          impressions: story.analytics?.impressions ?? 0,
        }));

        const response: ApiResponse = {
          success: true,
          data: analytics,
        };

        res.status(200).json(response);
        return;
      }

      // Regular users see only their own stories' analytics
      const analytics = await AnalyticsService.getUserStoriesAnalytics(userId);

      const response: ApiResponse = {
        success: true,
        data: analytics,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get analytics',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/analytics/:storyId/events
   * Get detailed analytics events for a story (protected endpoint)
   */
  static async getStoryAnalyticsEvents(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

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

      const result = await AnalyticsService.getStoryAnalyticsEvents(storyId, limit, offset);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get analytics events',
        },
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/analytics/:storyId/daywise
   * Get day-wise analytics for a story (protected endpoint)
   */
  static async getStoryDayWiseAnalytics(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

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

      if (days < 1 || days > 365) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Days must be between 1 and 365',
          },
        };
        res.status(400).json(response);
        return;
      }

      const result = await AnalyticsService.getStoryDayWiseAnalytics(storyId, days);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get day-wise analytics',
        },
      };

      res.status(500).json(response);
    }
  }
}
