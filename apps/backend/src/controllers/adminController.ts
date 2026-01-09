import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '@snappy/shared-types';
import { StoryService } from '../services/storyService';

export class AdminController {
  // Get admin dashboard stats
  static async getStats(_req: AuthRequest, res: Response) {
    try {
      const [totalUsers, totalAdvertisers, totalStories, totalViews, totalImpressions] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'advertiser' } }),
          prisma.story.count(),
          (prisma as any).storyAnalytics
            .aggregate({
              _sum: { views: true },
            })
            .then((result: any) => result._sum.views || 0),
          (prisma as any).storyAnalytics
            .aggregate({
              _sum: { impressions: true },
            })
            .then((result: any) => result._sum.impressions || 0),
        ]);

      const response: ApiResponse = {
        success: true,
        data: {
          totalUsers,
          totalPublishers: totalAdvertisers, // Keep field name for API compatibility
          totalStories,
          totalViews,
          totalImpressions,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get admin stats',
        },
      };
      res.status(500).json(response);
    }
  }

  // Get advertisers for story assignment (searchable, role='advertiser' only)
  static async getAdvertisers(req: AuthRequest, res: Response) {
    try {
      const { search = '' } = req.query;

      // Build where clause for search - only advertisers
      const where: any = {
        role: 'advertiser',
      };

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Get advertisers (limit to 50 for dropdown)
      const advertisers = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
        },
        take: 50,
        orderBy: {
          email: 'asc',
        },
      });

      const response: ApiResponse = {
        success: true,
        data: {
          advertisers: advertisers.map((user: { id: string; email: string; name: string | null }) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            displayText: `${user.email}${user.name ? ` <${user.name}>` : ''}`,
          })),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get advertisers',
        },
      };
      res.status(500).json(response);
    }
  }

  // Get all users with story counts
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = '',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for search
      const where: any = {};
      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Get users with story counts
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                stories: true,
              },
            },
          },
          skip,
          take: limitNum,
          orderBy: {
            [sortBy as string]: sortOrder as 'asc' | 'desc',
          },
        }),
        prisma.user.count({ where }),
      ]);

      const usersWithCounts = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storyCount: (user)._count.stories,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }));

      const response: ApiResponse = {
        success: true,
        data: {
          users: usersWithCounts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get users',
        },
      };
      res.status(500).json(response);
    }
  }

  // Get analytics for a specific user
  static async getUserAnalytics(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'User ID is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Get user's stories with analytics
      const stories = await prisma.story.findMany({
        where: { userId },
        include: {
          analytics: true,
        },
      });

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'User not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Map stories with analytics
      const analytics = stories.map((story: any) => ({
        storyId: story.id,
        storyTitle: story.title,
        views: story.analytics?.views ?? 0,
        avgPostsSeen: story.analytics?.avgPostsSeen ?? 0,
        avgTimeSpent: story.analytics?.avgTimeSpent ?? 0,
        avgAdsSeen: story.analytics?.avgAdsSeen ?? 0,
        impressions: story.analytics?.impressions ?? 0,
        clicks: story.analytics?.clicks ?? 0,
        ctr: story.analytics?.ctr ?? 0,
        viewability: story.analytics?.viewability ?? 0,
      }));

      const response: ApiResponse = {
        success: true,
        data: {
          user,
          analytics,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get user analytics',
        },
      };
      res.status(500).json(response);
    }
  }

  // Get all stories (admin can see all stories)
  static async getAllStories(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '50',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        userId,
        status,
        search = '',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      if (userId) {
        where.userId = userId as string;
      }
      if (status) {
        where.status = status as string;
      }
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { publisherName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [stories, total] = await Promise.all([
        prisma.story.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            frames: {
              include: {
                elements: true,
                background: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
            analytics: true,
          },
          skip,
          take: limitNum,
          orderBy: {
            [sortBy as string]: sortOrder as 'asc' | 'desc',
          },
        }),
        prisma.story.count({ where }),
      ]);

      const storiesWithUser = stories.map((story: any) => ({
        ...story,
        user: {
          id: story.user.id,
          email: story.user.email,
          name: story.user.name,
        },
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString(),
        frames: story.frames.map((frame: any) => ({
          ...frame,
          createdAt: frame.createdAt.toISOString(),
          updatedAt: frame.updatedAt.toISOString(),
          elements: frame.elements?.map((element: any) => ({
            ...element,
            createdAt: element.createdAt.toISOString(),
            updatedAt: element.updatedAt.toISOString(),
          })),
          background: frame.background
            ? {
                ...frame.background,
                createdAt: frame.background.createdAt.toISOString(),
                updatedAt: frame.background.updatedAt.toISOString(),
              }
            : undefined,
        })),
        analytics: story.analytics
          ? {
              ...story.analytics,
              createdAt: story.analytics.createdAt.toISOString(),
              updatedAt: story.analytics.updatedAt.toISOString(),
            }
          : null,
      }));

      const response: ApiResponse = {
        success: true,
        data: {
          stories: storiesWithUser,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get all stories',
        },
      };
      res.status(500).json(response);
    }
  }

  // Get analytics for all stories
  static async getAllStoriesAnalytics(_req: AuthRequest, res: Response) {
    try {
      const allStories = await prisma.story.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          analytics: true,
        },
      });

      const analytics = allStories.map((story: any) => ({
        storyId: story.id,
        storyTitle: story.title,
        userId: story.userId,
        user: {
          id: story.user.id,
          email: story.user.email,
          name: story.user.name,
        },
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
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: error.message || 'Failed to get all stories analytics',
        },
      };
      res.status(500).json(response);
    }
  }

  // Update any story (admin can edit any story)
  static async updateStory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const story = await StoryService.updateStoryAsAdmin(id || '', req.body);

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

  // Delete any story (admin can delete any story)
  static async deleteStory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await StoryService.deleteStoryAsAdmin(id || '');

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
}
