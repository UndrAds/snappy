import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AnalyticsEventType =
  | 'story_view'
  | 'player_viewport'
  | 'frame_view'
  | 'time_spent'
  | 'story_complete'
  | 'navigation_click'
  | 'cta_click';

export interface TrackEventData {
  storyId: string;
  eventType: AnalyticsEventType;
  frameIndex?: number;
  value?: number; // For time_spent events (in milliseconds)
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface StoryAnalytics {
  storyId: string;
  views: number;
  avgPostsSeen: number;
  avgTimeSpent: number;
  avgAdsSeen: number;
  impressions: number;
  clicks: number; // Total clicks (navigation clicks + CTA clicks)
  ctr: number; // Click-through rate for CTA clicks (percentage)
  viewability: number; // Viewability percentage (frames viewed / total frames)
}

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  static async trackEvent(data: TrackEventData): Promise<void> {
    try {
      // Verify story exists
      const story = await prisma.story.findUnique({
        where: { id: data.storyId },
      });

      if (!story) {
        throw new Error('Story not found');
      }

      // Create event record
      await (prisma as any).storyAnalyticsEvent.create({
        data: {
          storyId: data.storyId,
          eventType: data.eventType,
          frameIndex: data.frameIndex ?? null,
          value: data.value ?? null,
          sessionId: data.sessionId ?? null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        },
      });

      // Update aggregated analytics
      await this.updateAggregatedAnalytics(data.storyId);
    } catch (error: any) {
      console.error('Error tracking analytics event:', error);
      throw error;
    }
  }

  /**
   * Update aggregated analytics for a story
   */
  private static async updateAggregatedAnalytics(storyId: string): Promise<void> {
    try {
      // Get all events for this story
      const events = await (prisma as any).storyAnalyticsEvent.findMany({
        where: { storyId },
        orderBy: { createdAt: 'asc' },
      });

      // Get story first to know total frames count
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: { frames: true },
      });
      const totalFrames = story?.frames?.length || 1;

      // Calculate metrics
      // Views = number of times player appears in viewport
      const storyViews = events.filter((e: any) => e.eventType === 'player_viewport').length;

      // Impressions = stories viewed more than 50% of frames
      // Group by session and count only sessions where >50% of frames were viewed
      const sessionFrameCounts = new Map<string, Set<number>>();
      events.forEach((event: any) => {
        if (event.eventType === 'frame_view' && event.frameIndex !== null) {
          const sessionId = event.sessionId || 'anonymous';
          if (!sessionFrameCounts.has(sessionId)) {
            sessionFrameCounts.set(sessionId, new Set());
          }
          sessionFrameCounts.get(sessionId)!.add(event.frameIndex);
        }
      });

      // Count impressions: sessions where frames seen >= 50% of total frames
      const threshold = Math.ceil(totalFrames * 0.5); // 50% threshold
      let storyImpressions = 0;
      sessionFrameCounts.forEach((framesSeen) => {
        if (framesSeen.size >= threshold) {
          storyImpressions += 1;
        }
      });
      const navigationClicks = events.filter((e: any) => e.eventType === 'navigation_click').length;
      const ctaClicks = events.filter((e: any) => e.eventType === 'cta_click').length;
      const totalClicks = navigationClicks + ctaClicks;

      // Group events by session to calculate per-session metrics
      const sessions = new Map<
        string,
        {
          framesSeen: Set<number>;
          timeSpent: number;
          adsSeen: number;
        }
      >();

      events.forEach((event: any) => {
        const sessionId = event.sessionId || 'anonymous';
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, {
            framesSeen: new Set(),
            timeSpent: 0,
            adsSeen: 0,
          });
        }

        const session = sessions.get(sessionId)!;

        if (event.eventType === 'frame_view' && event.frameIndex !== null) {
          session.framesSeen.add(event.frameIndex);
        } else if (event.eventType === 'time_spent' && event.value !== null) {
          session.timeSpent += event.value;
        }
      });

      // Calculate averages
      const sessionCount = sessions.size || 1; // Avoid division by zero
      const avgPostsSeen =
        Array.from(sessions.values()).reduce((sum, s) => sum + s.framesSeen.size, 0) / sessionCount;
      const avgTimeSpent =
        Array.from(sessions.values()).reduce((sum, s) => sum + s.timeSpent, 0) / sessionCount;
      const avgAdsSeen =
        Array.from(sessions.values()).reduce((sum, s) => sum + s.adsSeen, 0) / sessionCount;

      // Calculate CTR: (CTA clicks / story views) * 100
      const ctr = storyViews > 0 ? (ctaClicks / storyViews) * 100 : 0;

      // Debug logging for CTR calculation
      if (ctaClicks > 0 || storyViews > 0) {
        console.log(
          `[Analytics] Story ${storyId}: Views=${storyViews}, CTA Clicks=${ctaClicks}, CTR=${ctr.toFixed(2)}%`
        );
      }

      // Calculate viewability: (average frames seen / total frames) * 100
      const viewability = totalFrames > 0 ? (avgPostsSeen / totalFrames) * 100 : 0;

      // Upsert aggregated analytics
      await (prisma as any).storyAnalytics.upsert({
        where: { storyId },
        create: {
          storyId,
          views: storyViews,
          avgPostsSeen,
          avgTimeSpent,
          avgAdsSeen,
          impressions: storyImpressions,
          clicks: totalClicks,
          ctr,
          viewability,
        },
        update: {
          views: storyViews,
          avgPostsSeen,
          avgTimeSpent,
          avgAdsSeen,
          impressions: storyImpressions,
          clicks: totalClicks,
          ctr,
          viewability,
        },
      });
    } catch (error: any) {
      console.error('Error updating aggregated analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific story
   */
  static async getStoryAnalytics(storyId: string): Promise<StoryAnalytics | null> {
    try {
      const analytics = await (prisma as any).storyAnalytics.findUnique({
        where: { storyId },
      });

      if (!analytics) {
        // Return default values if no analytics exist yet
        return {
          storyId,
          views: 0,
          avgPostsSeen: 0,
          avgTimeSpent: 0,
          avgAdsSeen: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          viewability: 0,
        };
      }

      return {
        storyId: analytics.storyId,
        views: analytics.views,
        avgPostsSeen: analytics.avgPostsSeen,
        avgTimeSpent: analytics.avgTimeSpent,
        avgAdsSeen: analytics.avgAdsSeen,
        impressions: analytics.impressions,
        clicks: analytics.clicks ?? 0,
        ctr: analytics.ctr ?? 0,
        viewability: analytics.viewability ?? 0,
      };
    } catch (error: any) {
      console.error('Error getting story analytics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated analytics for all stories owned by a user
   */
  static async getUserStoriesAnalytics(userId: string): Promise<StoryAnalytics[]> {
    try {
      const stories = await prisma.story.findMany({
        where: { userId },
        include: {
          analytics: true,
        } as any,
      });

      return stories.map((story: any) => {
        const analytics = story['analytics'] || story.analytics;
        return {
          storyId: story.id,
          views: analytics?.views ?? 0,
          avgPostsSeen: analytics?.avgPostsSeen ?? 0,
          avgTimeSpent: analytics?.avgTimeSpent ?? 0,
          avgAdsSeen: analytics?.avgAdsSeen ?? 0,
          impressions: analytics?.impressions ?? 0,
          clicks: analytics?.clicks ?? 0,
          ctr: analytics?.ctr ?? 0,
          viewability: analytics?.viewability ?? 0,
        };
      });
    } catch (error: any) {
      console.error('Error getting user stories analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics events for a story (for detailed analysis)
   */
  static async getStoryAnalyticsEvents(
    storyId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    events: Array<{
      id: string;
      eventType: string;
      frameIndex: number | null;
      value: number | null;
      sessionId: string | null;
      metadata: any;
      createdAt: Date;
    }>;
    total: number;
  }> {
    try {
      const [events, total] = await Promise.all([
        (prisma as any).storyAnalyticsEvent.findMany({
          where: { storyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        (prisma as any).storyAnalyticsEvent.count({
          where: { storyId },
        }),
      ]);

      return {
        events: events.map((event: any) => ({
          id: event.id,
          eventType: event.eventType,
          frameIndex: event.frameIndex,
          value: event.value,
          sessionId: event.sessionId,
          metadata: event.metadata,
          createdAt: event.createdAt,
        })),
        total,
      };
    } catch (error: any) {
      console.error('Error getting story analytics events:', error);
      throw error;
    }
  }

  /**
   * Get day-wise analytics for a story
   */
  static async getStoryDayWiseAnalytics(
    storyId: string,
    days: number | undefined = 30,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      date: string; // YYYY-MM-DD format
      views: number;
      impressions: number;
      avgPostsSeen: number;
      avgTimeSpent: number;
      avgAdsSeen: number;
      sessions: number;
      ctaClicks: number;
      ctr: number;
    }>
  > {
    try {
      // Use provided dates or calculate from days
      const finalEndDate = endDate || new Date();
      const finalStartDate =
        startDate ||
        (() => {
          const date = new Date();
          date.setDate(date.getDate() - (days || 30));
          return date;
        })();

      // Calculate number of days for result generation
      const daysDiff = Math.ceil(
        (finalEndDate.getTime() - finalStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      // Use calculated daysDiff if we have a date range, otherwise use provided days (or 30 as fallback)
      const actualDays = startDate && endDate ? daysDiff : daysDiff > 0 ? daysDiff : days || 30;

      // Get story to know total frames count
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: { frames: true },
      });
      const totalFrames = story?.frames?.length || 1;
      const threshold = Math.ceil(totalFrames * 0.5); // 50% threshold

      // Get all events for this story in the date range
      const events = await (prisma as any).storyAnalyticsEvent.findMany({
        where: {
          storyId,
          createdAt: {
            gte: finalStartDate,
            lte: finalEndDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group events by date
      const dailyData = new Map<
        string,
        {
          views: Set<string>; // Track unique sessions for views
          impressions: number;
          sessions: Set<string>;
          framesSeen: Map<string, Set<number>>; // sessionId -> Set<frameIndex>
          timeSpent: Map<string, number>; // sessionId -> total time
          adsSeen: Map<string, number>; // sessionId -> count
          ctaClicks: number; // CTA clicks for CTR calculation
        }
      >();

      events.forEach((event: any) => {
        const dateStr: string = event.createdAt.toISOString().split('T')[0];
        const sessionId: string = event.sessionId || 'anonymous';

        if (!dailyData.has(dateStr)) {
          dailyData.set(dateStr, {
            views: new Set(),
            impressions: 0,
            sessions: new Set(),
            framesSeen: new Map(),
            timeSpent: new Map(),
            adsSeen: new Map(),
            ctaClicks: 0,
          });
        }

        const dayData = dailyData.get(dateStr)!;
        dayData.sessions.add(sessionId);

        if (event.eventType === 'player_viewport') {
          // Views = number of times player appears in viewport
          dayData.views.add(sessionId);
        } else if (event.eventType === 'frame_view' && event.frameIndex !== null) {
          if (!dayData.framesSeen.has(sessionId)) {
            dayData.framesSeen.set(sessionId, new Set());
          }
          dayData.framesSeen.get(sessionId)!.add(event.frameIndex);
        } else if (event.eventType === 'time_spent' && event.value !== null) {
          dayData.timeSpent.set(sessionId, (dayData.timeSpent.get(sessionId) || 0) + event.value);
        } else if (event.eventType === 'cta_click') {
          dayData.ctaClicks += 1;
        }
      });

      // Calculate daily metrics
      const result: Array<{
        date: string;
        views: number;
        impressions: number;
        avgPostsSeen: number;
        avgTimeSpent: number;
        avgAdsSeen: number;
        sessions: number;
        ctaClicks: number;
        ctr: number;
      }> = [];

      // Generate all dates in range (including days with no data)
      for (let i = 0; i < actualDays; i++) {
        const date = new Date(finalStartDate);
        date.setDate(date.getDate() + i);
        const dateStr: string = date.toISOString().split('T')[0] || '';
        const dayData = dailyData.get(dateStr) || {
          views: new Set(),
          impressions: 0,
          sessions: new Set(),
          framesSeen: new Map(),
          timeSpent: new Map(),
          adsSeen: new Map(),
          ctaClicks: 0,
        };

        const sessionCount = dayData.sessions.size || 1;
        const avgPostsSeen =
          Array.from(dayData.framesSeen.values()).reduce((sum, frames) => sum + frames.size, 0) /
          sessionCount;
        const avgTimeSpent =
          Array.from(dayData.timeSpent.values()).reduce((sum, time) => sum + time, 0) /
          sessionCount;
        const avgAdsSeen =
          Array.from(dayData.adsSeen.values()).reduce((sum, ads) => sum + ads, 0) / sessionCount;

        // Calculate impressions: sessions where frames seen >= 50% of total frames
        let dayImpressions = 0;
        dayData.framesSeen.forEach((framesSeen) => {
          if (framesSeen.size >= threshold) {
            dayImpressions += 1;
          }
        });

        // Calculate CTR for this day: (CTA clicks / views) * 100
        const dayCtr = dayData.views.size > 0 ? (dayData.ctaClicks / dayData.views.size) * 100 : 0;

        result.push({
          date: dateStr || '',
          views: dayData.views.size,
          impressions: dayImpressions,
          avgPostsSeen: isNaN(avgPostsSeen) ? 0 : avgPostsSeen,
          avgTimeSpent: isNaN(avgTimeSpent) ? 0 : avgTimeSpent,
          avgAdsSeen: isNaN(avgAdsSeen) ? 0 : avgAdsSeen,
          sessions: dayData.sessions.size,
          ctaClicks: dayData.ctaClicks,
          ctr: dayCtr,
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error getting day-wise analytics:', error);
      throw error;
    }
  }
}
