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
      const validEventTypes = [
        'story_view',
        'player_viewport',
        'frame_view',
        'time_spent',
        'story_complete',
        'navigation_click',
        'cta_click',
      ];
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
   * Regular users can only view their own stories' analytics
   * Admins can view any story's analytics
   */
  static async getStoryAnalytics(req: Request, res: Response) {
    try {
      const { storyId } = req.params;
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

      // Check ownership for regular users (admins can view any story)
      if (userRole !== 'admin') {
        const story = await prisma.story.findUnique({
          where: { id: storyId },
          select: { userId: true },
        });

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

        if (story.userId !== userId) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: "You do not have permission to view this story's analytics",
            },
          };
          res.status(403).json(response);
          return;
        }
      }

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
   * All users (including admins) see only their own stories' analytics
   */
  static async getUserStoriesAnalytics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

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

      // All users (including admins) see only their own stories' analytics
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
      const limit = parseInt(req.query['limit'] as string) || 100;
      const offset = parseInt(req.query['offset'] as string) || 0;

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
      const daysParam = req.query['days'] as string;
      const startDateParam = req.query['startDate'] as string;
      const endDateParam = req.query['endDate'] as string;

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

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let days: number | undefined = 30;

      if (startDateParam && endDateParam) {
        // Custom date range
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999); // End of day

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'Invalid date format. Use YYYY-MM-DD',
            },
          };
          res.status(400).json(response);
          return;
        }

        if (startDate > endDate) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'Start date must be before end date',
            },
          };
          res.status(400).json(response);
          return;
        }
      } else if (daysParam) {
        days = parseInt(daysParam);
        // For "All" option (days >= 3650), use story creation date as start
        if (days >= 3650) {
          // "All" option - fetch story creation date and use it as start date
          const story = await prisma.story.findUnique({
            where: { id: storyId },
            select: { createdAt: true },
          });

          if (story) {
            startDate = story.createdAt;
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            days = undefined; // Don't use days calculation, use date range instead
          } else {
            // Fallback: use 365 days if story not found
            days = 365;
          }
        } else if (days < 1 || days > 365) {
          const response: ApiResponse = {
            success: false,
            error: {
              message: 'Days must be between 1 and 365',
            },
          };
          res.status(400).json(response);
          return;
        }
      }

      const result = await AnalyticsService.getStoryDayWiseAnalytics(
        storyId,
        days,
        startDate,
        endDate
      );

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
