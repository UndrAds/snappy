import { PrismaClient } from '@prisma/client';
import {
  Story,
  CreateStoryRequest,
  UpdateStoryRequest,
  StoryFrame,
  CreateStoryFrameRequest,
  UpdateStoryFrameRequest,
  StoryElement,
  CreateStoryElementRequest,
  UpdateStoryElementRequest,
  StoryBackground,
  CreateStoryBackgroundRequest,
  RSSFeedItem,
  RSSConfig,
} from '@snappy/shared-types';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to convert Prisma story to shared types format
function convertPrismaStoryToSharedType(prismaStory: any): Story {
  return {
    ...prismaStory,
    createdAt: prismaStory.createdAt.toISOString(),
    updatedAt: prismaStory.updatedAt.toISOString(),
    frames: prismaStory.frames?.map((frame: any) => {
      console.log('Converting frame to shared type:', {
        frameId: frame.id,
        frameName: frame.name,
        frameLink: frame.link,
        frameLinkText: frame.linkText,
        hasLink: !!frame.link,
        hasLinkText: !!frame.linkText,
      });
      return {
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
      };
    }),
  } as Story;
}

export class StoryService {
  // Generate unique ID for story
  private static generateUniqueId(title: string): string {
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const randomHash = crypto.randomBytes(8).toString('hex');
    return `${sanitizedTitle}-${randomHash}`;
  }

  // Create a new story
  static async createStory(userId: string, data: CreateStoryRequest): Promise<Story> {
    // Use provided uniqueId or generate a new one
    const uniqueId = (data as any).uniqueId || this.generateUniqueId(data.title);

    const story = await prisma.story.create({
      data: {
        title: data.title,
        uniqueId,
        publisherName: data.publisherName,
        publisherPic: data.publisherPic || null,
        largeThumbnail: data.largeThumbnail || null,
        smallThumbnail: data.smallThumbnail || null,
        ctaType: data.ctaType || null,
        ctaValue: data.ctaValue || null,
        ctaText: data.ctaText || null,
        format: data.format || 'portrait',
        deviceFrame: data.deviceFrame || 'mobile',
        storyType: data.storyType || 'static',
        rssConfig: data.rssConfig ? JSON.parse(JSON.stringify(data.rssConfig)) : null,
        userId,
      },
      include: {
        frames: {
          include: {
            elements: true,
            background: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Handle dynamic story setup
    if (data.storyType === 'dynamic' && data.rssConfig) {
      try {
        console.log(`Setting up dynamic story ${story.id} with RSS config:`, {
          feedUrl: data.rssConfig.feedUrl,
          updateIntervalMinutes: data.rssConfig.updateIntervalMinutes,
          maxPosts: data.rssConfig.maxPosts,
          allowRepetition: data.rssConfig.allowRepetition,
          isActive: data.rssConfig.isActive,
        });

        const { SchedulerService } = await import('./schedulerService');
        const schedulerService = new SchedulerService();

        // Schedule RSS updates (includes immediate processing)
        await schedulerService.scheduleRSSUpdate(story.id, data.rssConfig);

        console.log(`✅ Dynamic story ${story.id} created and RSS processing scheduled`);

        // Wait a moment for the job to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if frames were created
        const storyWithFrames = await prisma.story.findUnique({
          where: { id: story.id },
          include: { frames: true },
        });

        console.log(`📊 Story ${story.id} now has ${storyWithFrames?.frames?.length || 0} frames`);
        if (
          storyWithFrames?.frames &&
          storyWithFrames.frames.length > 0 &&
          storyWithFrames.frames[0]
        ) {
          console.log(`🔗 First frame link: ${storyWithFrames.frames[0].link}`);
          console.log(`🔗 First frame linkText: ${storyWithFrames.frames[0].linkText}`);
        }
      } catch (error) {
        console.error('❌ Error setting up dynamic story RSS processing:', error);
        // Don't fail the story creation if RSS setup fails
      }
    }

    return convertPrismaStoryToSharedType(story);
  }

  // Get story by ID
  static async getStoryById(storyId: string, userId?: string): Promise<Story | null> {
    const where: any = { id: storyId };

    // If userId is provided, ensure the story belongs to that user
    if (userId) {
      where.userId = userId;
    }

    const story = await prisma.story.findFirst({
      where,
      include: {
        frames: {
          include: {
            elements: true,
            background: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (story && story.frames && story.frames.length > 0) {
      console.log(
        'Raw Prisma story frames:',
        story.frames.map((frame: any) => ({
          id: frame.id,
          name: frame.name,
          link: frame.link,
          linkText: frame.linkText,
          hasLink: !!frame.link,
          hasLinkText: !!frame.linkText,
        }))
      );
    }

    return story ? convertPrismaStoryToSharedType(story) : null;
  }

  // Get story by unique ID
  static async getStoryByUniqueId(uniqueId: string): Promise<Story | null> {
    const story = await prisma.story.findUnique({
      where: { uniqueId },
      include: {
        frames: {
          include: {
            elements: true,
            background: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return story ? convertPrismaStoryToSharedType(story) : null;
  }

  // Get all stories for a user
  static async getUserStories(userId: string): Promise<Story[]> {
    const stories = await prisma.story.findMany({
      where: { userId },
      include: {
        frames: {
          include: {
            elements: true,
            background: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stories.map((story: any) => convertPrismaStoryToSharedType(story));
  }

  // Update story
  static async updateStory(
    storyId: string,
    userId: string,
    data: UpdateStoryRequest
  ): Promise<Story> {
    const story = await prisma.story.update({
      where: {
        id: storyId,
        userId, // Ensure user owns the story
      },
      data: {
        ...data,
        rssConfig: data.rssConfig ? JSON.parse(JSON.stringify(data.rssConfig)) : undefined,
      },
      include: {
        frames: {
          include: {
            elements: true,
            background: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return convertPrismaStoryToSharedType(story);
  }

  // Delete story
  static async deleteStory(storyId: string, userId: string): Promise<void> {
    await prisma.story.delete({
      where: {
        id: storyId,
        userId, // Ensure user owns the story
      },
    });
  }

  // Create story frame
  static async createStoryFrame(
    storyId: string,
    userId: string,
    data: CreateStoryFrameRequest
  ): Promise<StoryFrame> {
    // Verify story belongs to user
    await prisma.story.findFirstOrThrow({
      where: {
        id: storyId,
        userId,
      },
    });

    const frame = await prisma.storyFrame.create({
      data: {
        order: data.order,
        hasContent: data.hasContent || false,
        name: data.name || null,
        link: data.link || null,
        linkText: data.linkText || null,
        storyId,
      },
      include: {
        elements: true,
        background: true,
      },
    });

    return frame as unknown as StoryFrame;
  }

  // Update story frame
  static async updateStoryFrame(
    frameId: string,
    userId: string,
    data: UpdateStoryFrameRequest
  ): Promise<StoryFrame> {
    const frame = await prisma.storyFrame.update({
      where: {
        id: frameId,
        story: {
          userId, // Ensure user owns the story
        },
      },
      data,
      include: {
        elements: true,
        background: true,
      },
    });

    return frame as unknown as StoryFrame;
  }

  // Delete story frame
  static async deleteStoryFrame(frameId: string, userId: string): Promise<void> {
    await prisma.storyFrame.delete({
      where: {
        id: frameId,
        story: {
          userId, // Ensure user owns the story
        },
      },
    });
  }

  // Create story element
  static async createStoryElement(
    frameId: string,
    userId: string,
    data: CreateStoryElementRequest
  ): Promise<StoryElement> {
    // Verify frame belongs to user's story
    await prisma.storyFrame.findFirstOrThrow({
      where: {
        id: frameId,
        story: {
          userId,
        },
      },
    });

    const element = await prisma.storyElement.create({
      data: {
        type: data.type,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        content: data.content || null,
        mediaUrl: data.mediaUrl || null,
        style: data.style,
        frameId,
      },
    });

    return element as unknown as StoryElement;
  }

  // Update story element
  static async updateStoryElement(
    elementId: string,
    userId: string,
    data: UpdateStoryElementRequest
  ): Promise<StoryElement> {
    const element = await prisma.storyElement.update({
      where: {
        id: elementId,
        frame: {
          story: {
            userId, // Ensure user owns the story
          },
        },
      },
      data,
    });

    return element as unknown as StoryElement;
  }

  // Delete story element
  static async deleteStoryElement(elementId: string, userId: string): Promise<void> {
    await prisma.storyElement.delete({
      where: {
        id: elementId,
        frame: {
          story: {
            userId, // Ensure user owns the story
          },
        },
      },
    });
  }

  // Create or update story background
  static async upsertStoryBackground(
    frameId: string,
    userId: string,
    data: CreateStoryBackgroundRequest
  ): Promise<StoryBackground> {
    // Verify frame belongs to user's story
    await prisma.storyFrame.findFirstOrThrow({
      where: {
        id: frameId,
        story: {
          userId,
        },
      },
    });

    const background = await prisma.storyBackground.upsert({
      where: {
        frameId,
      },
      update: data,
      create: {
        ...data,
        frameId,
      },
    });

    return background as unknown as StoryBackground;
  }

  // Delete story background
  static async deleteStoryBackground(frameId: string, userId: string): Promise<void> {
    await prisma.storyBackground.delete({
      where: {
        frameId,
        frame: {
          story: {
            userId, // Ensure user owns the story
          },
        },
      },
    });
  }

  // Save complete story with frames, elements, and backgrounds
  static async saveCompleteStory(userId: string, storyData: any): Promise<Story> {
    const { story, frames } = storyData;
    console.log(
      'Backend received frames:',
      frames.map((f: any) => ({ id: f.id, name: f.name, type: f.type }))
    );

    // Update or create story
    let dbStory: Story;
    if (story.id) {
      // Update existing story
      dbStory = await this.updateStory(story.id, userId, story);
    } else if (story.uniqueId) {
      // Try to find story by uniqueId and update it
      const existingStory = await this.getStoryByUniqueId(story.uniqueId);
      if (existingStory && existingStory.userId === userId) {
        dbStory = await this.updateStory(existingStory.id, userId, story);
      } else {
        // Create new story with the provided uniqueId
        dbStory = await this.createStory(userId, story);
      }
    } else {
      // Create new story
      dbStory = await this.createStory(userId, story);
    }

    // Clear existing frames and recreate them
    await prisma.storyFrame.deleteMany({
      where: {
        storyId: dbStory.id,
      },
    });

    // Create frames with elements and backgrounds
    for (const frame of frames) {
      console.log('Creating frame with name:', frame.name);
      const dbFrame = await prisma.storyFrame.create({
        data: {
          order: frame.order,
          type: frame.type || 'story',
          hasContent: frame.hasContent,
          name: frame.name || null,
          link: frame.link || null,
          linkText: frame.linkText || null,
          adConfig: frame.adConfig || null,
          storyId: dbStory.id,
        },
      });
      console.log('Created frame:', { id: dbFrame.id, name: dbFrame.name });

      // Create elements
      for (const element of frame.elements || []) {
        await prisma.storyElement.create({
          data: {
            type: element.type,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            content: element.content || null,
            mediaUrl: element.mediaUrl || null,
            style: element.style,
            frameId: dbFrame.id,
          },
        });
      }

      // Create background
      if (frame.background) {
        await prisma.storyBackground.create({
          data: {
            type: frame.background.type,
            value: frame.background.value,
            opacity: frame.background.opacity || null,
            rotation: frame.background.rotation || null,
            zoom: frame.background.zoom || null,
            filter: frame.background.filter || null,
            offsetX: frame.background.offsetX || null,
            offsetY: frame.background.offsetY || null,
            frameId: dbFrame.id,
          },
        });
      }
    }

    // Return updated story
    return (await this.getStoryById(dbStory.id, userId)) as Story;
  }

  // Get all active dynamic stories
  static async getActiveDynamicStories(): Promise<Story[]> {
    const stories = await prisma.story.findMany({
      where: {
        storyType: 'dynamic',
      },
      include: {
        frames: {
          include: {
            elements: true,
            background: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Filter out stories with null rssConfig
    const activeStories = stories.filter((story: any) => story.rssConfig !== null);

    return activeStories.map((story: any) => convertPrismaStoryToSharedType(story));
  }

  // Update RSS configuration for a story
  static async updateStoryRSSConfig(storyId: string, rssConfig: RSSConfig): Promise<void> {
    await prisma.story.update({
      where: { id: storyId },
      data: { rssConfig: JSON.parse(JSON.stringify(rssConfig)) },
    });
  }

  // Generate frames from RSS feed items
  static async generateFramesFromRSS(storyId: string, feedItems: RSSFeedItem[]): Promise<number> {
    try {
      console.log(`Starting frame generation for story ${storyId} with ${feedItems.length} items`);

      // Get the story to understand its format
      const story = await prisma.story.findUnique({
        where: { id: storyId },
      });

      if (!story) {
        throw new Error('Story not found');
      }

      console.log(`Found story: ${story.title}, clearing existing frames...`);

      // Clear existing frames
      const deletedCount = await prisma.storyFrame.deleteMany({
        where: { storyId },
      });

      console.log(`Deleted ${deletedCount.count} existing frames`);

      let framesGenerated = 0;

      // Create frames for each RSS item
      for (let i = 0; i < feedItems.length; i++) {
        const item = feedItems[i];
        if (!item) continue;

        // Debug logging for frame creation
        console.log(`Creating frame ${i + 1} for RSS item:`, {
          title: item.title,
          link: item.link,
          hasLink: !!item.link,
          imageUrl: item.imageUrl,
          hasImage: !!item.imageUrl,
        });

        // Create frame with RSS title as name and link
        const frame = await prisma.storyFrame.create({
          data: {
            order: i,
            type: 'story',
            hasContent: true,
            name: item.title, // Use RSS item title as frame name
            link: item.link || null, // Use RSS item link as frame link
            linkText: 'Read More', // Default link text for RSS frames
            storyId,
          },
        });

        console.log(`Created frame with link:`, frame.link);

        // Create background with RSS image
        if (item.imageUrl) {
          await prisma.storyBackground.create({
            data: {
              type: 'image',
              value: item.imageUrl,
              frameId: frame.id,
              // Add proper background properties for panning and zooming
              zoom: 100, // Default zoom level
              offsetX: 0, // Default X offset for panning
              offsetY: 0, // Default Y offset for panning
              rotation: 0, // Default rotation
              opacity: 100, // Default opacity
            },
          });
        }

        // Create title text element with dynamic sizing
        const frameWidth = story.format === 'portrait' ? 288 : 550; // Frame width
        const frameHeight = story.format === 'portrait' ? 550 : 288; // Frame height
        const fontSize = story.format === 'portrait' ? 18 : 24;
        const horizontalPadding = 20; // Left and right margins
        const ctaHeight = 60; // Space reserved for CTA button
        const bottomPadding = 20; // Padding from CTA area

        // Calculate text width with left margin and right margin
        const rightMargin = 40; // Extra margin from right edge
        const textWidth = frameWidth - horizontalPadding - rightMargin;

        // Estimate text height based on text length and font size
        // Rough calculation: average characters per line, with line height of 1.2
        const avgCharsPerLine = textWidth / (fontSize * 0.6); // Rough character width estimation
        const estimatedLines = Math.ceil(item.title.length / avgCharsPerLine);
        const lineHeight = fontSize * 1.2;
        const verticalPadding = 60; // Even more increased top and bottom padding
        const textHeight = Math.max(estimatedLines * lineHeight + verticalPadding, 80); // Even more increased minimum height

        // Position above CTA button area
        const textY = frameHeight - ctaHeight - textHeight - bottomPadding;

        const textElement = await prisma.storyElement.create({
          data: {
            type: 'text',
            x: horizontalPadding, // Left margin (moves text element left)
            y: textY, // Position above CTA area
            width: textWidth, // Width with right margin
            height: textHeight, // Dynamic height based on text
            content: item.title,
            frameId: frame.id,
            style: {
              fontSize: fontSize,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              color: '#FFFFFF',
              backgroundColor: '#000000',
              textOpacity: 100, // 100% text opacity
              backgroundOpacity: 100, // 100% background opacity
              textAlign: 'center', // Center text within the element
              padding: '8px',
              lineHeight: 1.2, // Line height for better text wrapping
              wordWrap: 'break-word', // Allow text to wrap
            },
          },
        });

        console.log(`Created text element for frame ${frame.id}:`, {
          title: item.title,
          position: { x: textElement.x, y: textElement.y },
          size: { width: textElement.width, height: textElement.height },
          frameFormat: story.format,
        });

        framesGenerated++;
      }

      console.log(`Generated ${framesGenerated} frames for story ${storyId}`);

      // Final verification - check if frames were actually saved
      const verificationFrames = await prisma.storyFrame.findMany({
        where: { storyId },
        select: { id: true, name: true, link: true, linkText: true },
      });

      console.log(
        `Final verification - ${verificationFrames.length} frames in database:`,
        verificationFrames.map((frame: any) => ({
          id: frame.id,
          name: frame.name,
          link: frame.link,
          linkText: frame.linkText,
          hasLink: !!frame.link,
          hasLinkText: !!frame.linkText,
        }))
      );

      return framesGenerated;
    } catch (error) {
      console.error('Error generating frames from RSS:', error);
      throw error;
    }
  }

  // Get RSS processing status for a story
  static async getRSSProcessingStatus(_storyId: string): Promise<any> {
    // This will be implemented with Redis integration
    return null;
  }

  // Validate RSS configuration
  static async validateRSSConfig(rssConfig: RSSConfig): Promise<boolean> {
    try {
      // Basic validation
      if (!rssConfig.feedUrl || !rssConfig.feedUrl.startsWith('http')) {
        return false;
      }

      if (rssConfig.updateIntervalMinutes < 5) {
        return false; // Minimum 5 minutes
      }

      if (rssConfig.maxPosts < 1 || rssConfig.maxPosts > 50) {
        return false; // Reasonable limits
      }

      return true;
    } catch (error) {
      console.error('RSS config validation error:', error);
      return false;
    }
  }
}
