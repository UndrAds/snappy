import Queue from 'bull';
import Redis from 'ioredis';
import { RSSService } from './rssService';
import { StoryService } from './storyService';
import { RSSConfig, RSSProcessingStatus } from '@snappy/shared-types';

export class SchedulerService {
  private redis: Redis;
  private rssQueue: Queue.Queue;
  private rssService: RSSService;

  constructor() {
    // Initialize Redis connection
    const redisConfig: any = {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      maxRetriesPerRequest: 3,
    };

    if (process.env['REDIS_PASSWORD']) {
      redisConfig.password = process.env['REDIS_PASSWORD'];
    }

    this.redis = new Redis(redisConfig);

    // Initialize Bull Queue
    const queueRedisConfig: any = {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
    };

    if (process.env['REDIS_PASSWORD']) {
      queueRedisConfig.password = process.env['REDIS_PASSWORD'];
    }

    this.rssQueue = new Queue('RSS processing', {
      redis: queueRedisConfig,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.rssService = new RSSService();
    this.setupQueueProcessors();
  }

  /**
   * Setup queue processors
   */
  private setupQueueProcessors() {
    // Process RSS update jobs
    this.rssQueue.process('update-story', async (job) => {
      const { storyId, rssConfig } = job.data;

      try {
        console.log(`Processing RSS update for story: ${storyId}`);

        // Verify story still exists and is eligible for RSS updates
        const existingStory = await StoryService.getStoryById(storyId);
        if (!existingStory) {
          console.warn(`RSS update skipped: story ${storyId} no longer exists.`);
          // Best-effort: cancel any recurring jobs and clear status
          try {
            await this.cancelRSSUpdates(storyId);
          } catch {}
          try {
            await this.clearProcessingStatus(storyId);
          } catch {}
          return;
        }
        if (!existingStory.rssConfig || existingStory.storyType !== 'dynamic') {
          console.warn(`RSS update skipped: story ${storyId} is not dynamic or has no rssConfig.`);
          try {
            await this.cancelRSSUpdates(storyId);
          } catch {}
          return;
        }
        if (existingStory.rssConfig && existingStory.rssConfig.isActive === false) {
          console.warn(`RSS update skipped: story ${storyId} RSS is inactive.`);
          try {
            await this.cancelRSSUpdates(storyId);
          } catch {}
          return;
        }

        // Update processing status
        await this.updateProcessingStatus(storyId, {
          storyId,
          status: 'processing',
          progress: 0,
          message: 'Fetching RSS feed...',
        });

        // Fetch RSS feed items
        const feedItems = await this.rssService.getFeedItemsForStory(rssConfig);

        // Debug logging for RSS items
        console.log(`RSS processing for story ${storyId}:`);
        console.log(`Found ${feedItems.length} items`);
        if (feedItems.length > 0 && feedItems[0]) {
          console.log(`First item link: ${feedItems[0].link}`);
          console.log(`First item has link: ${!!feedItems[0].link}`);
        }

        await this.updateProcessingStatus(storyId, {
          storyId,
          status: 'processing',
          progress: 30,
          message: `Found ${feedItems.length} items, generating frames...`,
        });

        // Generate frames from RSS items
        console.log(`About to generate frames for story ${storyId} with ${feedItems.length} items`);

        let framesGenerated = 0;
        try {
          framesGenerated = await StoryService.generateFramesFromRSS(storyId, feedItems);
          console.log(`Generated ${framesGenerated} frames for story ${storyId}`);

          // Wait a moment for database to commit
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verify frames were created with links
          const updatedStory = await StoryService.getStoryById(storyId);
          if (updatedStory && updatedStory.frames && updatedStory.frames.length > 0) {
            console.log(
              `Verification - Updated story frames:`,
              updatedStory.frames.map((frame) => ({
                id: frame.id,
                name: frame.name,
                link: frame.link,
                linkText: frame.linkText,
                hasLink: !!frame.link,
                hasLinkText: !!frame.linkText,
              }))
            );
          } else {
            console.error(`ERROR: No frames found after generation for story ${storyId}`);
          }
        } catch (frameError) {
          console.error(`ERROR generating frames for story ${storyId}:`, frameError);
          throw frameError;
        }

        await this.updateProcessingStatus(storyId, {
          storyId,
          status: 'processing',
          progress: 80,
          message: 'Updating story configuration...',
          framesGenerated,
          totalFrames: feedItems.length,
        });

        // Read current story to get the latest rssConfig (preserves adInsertionConfig)
        const currentStory = await StoryService.getStoryById(storyId);
        if (!currentStory || !currentStory.rssConfig) {
          throw new Error('Story or RSS config not found');
        }

        // Update story with new RSS config, preserving adInsertionConfig from current story
        const updatedConfig = {
          ...currentStory.rssConfig, // Use current config to preserve adInsertionConfig
          ...rssConfig, // Override with job config (feedUrl, updateIntervalMinutes, etc.)
          adInsertionConfig: currentStory.rssConfig.adInsertionConfig, // Explicitly preserve adInsertionConfig
          lastUpdated: new Date().toISOString(),
          nextUpdate: this.rssService
            .getNextUpdateTime(rssConfig.updateIntervalMinutes)
            .toISOString(),
        };

        await StoryService.updateStoryRSSConfig(storyId, updatedConfig);

        await this.updateProcessingStatus(storyId, {
          storyId,
          status: 'completed',
          progress: 100,
          message: 'RSS update completed successfully',
          framesGenerated,
          totalFrames: feedItems.length,
        });

        console.log(`RSS update completed for story: ${storyId}`);
      } catch (error) {
        console.error(`RSS update failed for story ${storyId}:`, error);

        await this.updateProcessingStatus(storyId, {
          storyId,
          status: 'failed',
          progress: 0,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        });

        throw error;
      }
    });

    // Handle job completion
    this.rssQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    // Handle job failure
    this.rssQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });
  }

  /**
   * Schedule RSS update for a story
   */
  async scheduleRSSUpdate(storyId: string, rssConfig: RSSConfig): Promise<void> {
    try {
      console.log(`🚀 Scheduling RSS update for story ${storyId}`);

      // Schedule immediate update
      const immediateJob = await this.rssQueue.add(
        'update-story',
        {
          storyId,
          rssConfig,
        },
        {
          delay: 0, // Immediate execution
        }
      );

      console.log(`✅ Immediate RSS job scheduled with ID: ${immediateJob.id}`);

      // Schedule recurring updates
      if (rssConfig.isActive) {
        const recurringJob = await this.rssQueue.add(
          'update-story',
          {
            storyId,
            rssConfig,
          },
          {
            repeat: {
              every: rssConfig.updateIntervalMinutes * 60 * 1000, // Convert to milliseconds
            },
            jobId: `rss-update-${storyId}`, // Unique job ID to prevent duplicates
          }
        );
        console.log(`✅ Recurring RSS job scheduled with ID: ${recurringJob.id}`);
      }

      console.log(`🎯 RSS updates scheduled for story: ${storyId}`);
    } catch (error) {
      console.error('❌ Failed to schedule RSS update:', error);
      throw error;
    }
  }

  /**
   * Cancel RSS updates for a story
   */
  async cancelRSSUpdates(storyId: string): Promise<void> {
    try {
      // Remove recurring job
      const jobId = `rss-update-${storyId}`;
      const job = await this.rssQueue.getJob(jobId);

      if (job) {
        await job.remove();
        console.log(`Cancelled RSS updates for story: ${storyId}`);
      }
    } catch (error) {
      console.error('Failed to cancel RSS updates:', error);
      throw error;
    }
  }

  /**
   * Update processing status in Redis
   */
  async updateProcessingStatus(storyId: string, status: RSSProcessingStatus): Promise<void> {
    try {
      const key = `rss-processing:${storyId}`;
      await this.redis.setex(key, 3600, JSON.stringify(status)); // Expire after 1 hour
    } catch (error) {
      console.error('Failed to update processing status:', error);
    }
  }

  /**
   * Get processing status from Redis
   */
  async getProcessingStatus(storyId: string): Promise<RSSProcessingStatus | null> {
    try {
      const key = `rss-processing:${storyId}`;
      const statusData = await this.redis.get(key);

      if (statusData) {
        return JSON.parse(statusData);
      }

      return null;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      return null;
    }
  }

  /**
   * Clear processing status
   */
  async clearProcessingStatus(storyId: string): Promise<void> {
    try {
      const key = `rss-processing:${storyId}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to clear processing status:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    try {
      const waiting = await this.rssQueue.getWaiting();
      const active = await this.rssQueue.getActive();
      const completed = await this.rssQueue.getCompleted();
      const failed = await this.rssQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.rssQueue.close();
      await this.redis.quit();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Initialize scheduler for existing dynamic stories
   */
  async initializeScheduler(): Promise<void> {
    try {
      console.log('Initializing RSS scheduler...');

      // Get all active dynamic stories
      const dynamicStories = await StoryService.getActiveDynamicStories();

      for (const story of dynamicStories) {
        if (story.rssConfig && story.rssConfig.isActive) {
          await this.scheduleRSSUpdate(story.id, story.rssConfig);
        }
      }

      console.log(`Initialized scheduler for ${dynamicStories.length} dynamic stories`);
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
    }
  }
}
