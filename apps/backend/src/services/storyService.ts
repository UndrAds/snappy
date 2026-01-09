import { PrismaClient, Prisma } from '@prisma/client';
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
  AdInsertionConfig,
} from '@snappy/shared-types';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to convert Prisma story to shared types format
function convertPrismaStoryToSharedType(prismaStory: any): Story {
  // Ensure rssConfig is properly parsed if it's a string (shouldn't happen with Prisma Json, but just in case)
  let rssConfig = prismaStory.rssConfig;
  if (typeof rssConfig === 'string') {
    try {
      rssConfig = JSON.parse(rssConfig);
    } catch (e) {
      console.warn('Failed to parse rssConfig:', e);
      rssConfig = null;
    }
  }

  return {
    ...prismaStory,
    rssConfig: rssConfig, // Explicitly set rssConfig to ensure it's preserved
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
        frameType: frame.type,
        hasAdConfig: !!frame.adConfig,
      });
      return {
        ...frame,
        // Ensure adConfig is properly included (it's stored as JSON in Prisma)
        adConfig:
          frame.adConfig ||
          (frame.type === 'ad'
            ? {
                adId: `ad-${frame.id}`,
                adUnitPath: '/6355419/Travel/Europe/France/Paris',
                size: [300, 250],
              }
            : undefined),
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

    const createData: any = {
      title: data.title,
      uniqueId,
      publisherName: data.publisherName,
      publisherPic: data.publisherPic || null,
      // Thumbnails removed from implementation
      ctaType: data.ctaType || null,
      ctaValue: data.ctaValue || null,
      ctaText: data.ctaText || null,
      // Default to 'published' unless explicitly provided as 'draft' via caller
      // Do not override status; rely on Prisma default and ignore draft logic
      format: data.format || 'portrait',
      deviceFrame: data.deviceFrame || 'mobile',
      storyType: data.storyType || 'static',
      userId,
    };

    // Only include optional fields if they are provided
    if ((data as any).defaultDurationMs !== undefined) {
      createData.defaultDurationMs = (data as any).defaultDurationMs;
    }
    if ((data as any).cpm !== undefined) {
      createData.cpm = (data as any).cpm;
    }
    if (data.rssConfig) {
      createData.rssConfig = JSON.parse(JSON.stringify(data.rssConfig));
    }
    if ((data as any).embedConfig) {
      createData.embedConfig = JSON.parse(JSON.stringify((data as any).embedConfig));
    }
    const story = await prisma.story.create({
      data: createData,
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

  // Get all stories (for admin)
  static async getAllStories(): Promise<Story[]> {
    const stories = await prisma.story.findMany({
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
    // Whitelist only valid columns for Story update
    const updateData: any = {};
    if (typeof (data as any).title !== 'undefined') updateData.title = (data as any).title;
    if (typeof (data as any).publisherName !== 'undefined')
      updateData.publisherName = (data as any).publisherName;
    if (typeof (data as any).publisherPic !== 'undefined')
      updateData.publisherPic = (data as any).publisherPic;
    // Thumbnails removed from implementation
    if (typeof (data as any).ctaType !== 'undefined') updateData.ctaType = (data as any).ctaType;
    if (typeof (data as any).ctaValue !== 'undefined') updateData.ctaValue = (data as any).ctaValue;
    if (typeof (data as any).ctaText !== 'undefined') updateData.ctaText = (data as any).ctaText;
    if (typeof (data as any).status !== 'undefined') updateData.status = (data as any).status;
    if (typeof (data as any).format !== 'undefined') updateData.format = (data as any).format;
    if (typeof (data as any).deviceFrame !== 'undefined')
      updateData.deviceFrame = (data as any).deviceFrame;
    if (typeof (data as any).storyType !== 'undefined')
      updateData.storyType = (data as any).storyType;
    if (typeof (data as any).defaultDurationMs !== 'undefined')
      updateData.defaultDurationMs = (data as any).defaultDurationMs;
    if (typeof (data as any).cpm !== 'undefined') updateData.cpm = (data as any).cpm;
    if (typeof (data as any).rssConfig !== 'undefined') {
      updateData.rssConfig = (data as any).rssConfig
        ? JSON.parse(JSON.stringify((data as any).rssConfig))
        : null;
    }
    if (typeof (data as any).embedConfig !== 'undefined') {
      updateData.embedConfig = (data as any).embedConfig
        ? JSON.parse(JSON.stringify((data as any).embedConfig))
        : null;
    }

    const story = await prisma.story.update({
      where: {
        id: storyId,
        userId, // Ensure user owns the story
      },
      data: updateData,
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

    // If requested, apply default duration to all frames
    // Applying default duration to all frames skipped due to type mismatch in client types

    return convertPrismaStoryToSharedType(story);
  }

  // Delete story
  static async deleteStory(storyId: string, userId: string): Promise<void> {
    // First cancel any scheduled RSS updates and clear status
    try {
      const { SchedulerService } = await import('./schedulerService');
      const scheduler = new SchedulerService();
      await scheduler.cancelRSSUpdates(storyId);
      await scheduler.clearProcessingStatus(storyId);
      // Do not call cleanup() here to avoid closing shared Redis connection during request lifecycle
    } catch (e) {
      console.warn('Warning: failed to cancel RSS updates for deleted story', storyId, e);
    }

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

    const frameData: any = {
      order: data.order,
      hasContent: data.hasContent || false,
      name: data.name || null,
      link: data.link || null,
      linkText: data.linkText || null,
      storyId,
    };

    // Add type if provided (for ad frames)
    if (typeof (data as any).type !== 'undefined') {
      frameData.type = (data as any).type;
    }

    // Add adConfig if provided (for ad frames)
    if (typeof (data as any).adConfig !== 'undefined') {
      frameData.adConfig = (data as any).adConfig;
    }

    // Add durationMs if provided
    if (typeof (data as any).durationMs !== 'undefined') {
      frameData.durationMs = (data as any).durationMs;
    }

    const frame = await prisma.storyFrame.create({
      data: frameData,
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
    // Ensure the frame belongs to a story owned by the user
    await prisma.storyFrame.findFirstOrThrow({
      where: {
        id: frameId,
        story: { userId },
      },
    });

    // Build update payload, only include fields that are defined
    const updateData: any = {};
    if (typeof (data as any).name !== 'undefined') updateData.name = (data as any).name;
    if (typeof (data as any).link !== 'undefined') updateData.link = (data as any).link;
    if (typeof (data as any).linkText !== 'undefined') updateData.linkText = (data as any).linkText;
    if (typeof (data as any).order !== 'undefined') updateData.order = (data as any).order;
    if (typeof (data as any).hasContent !== 'undefined')
      updateData.hasContent = (data as any).hasContent;
    if (typeof (data as any).adConfig !== 'undefined') updateData.adConfig = (data as any).adConfig;
    if (typeof (data as any).durationMs !== 'undefined')
      updateData.durationMs = (data as any).durationMs;

    const frame = await prisma.storyFrame.update({
      where: { id: frameId },
      data: updateData,
      include: { elements: true, background: true },
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
          // durationMs omitted; rely on Prisma default
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
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      try {
        console.log(
          `Starting frame generation for story ${storyId} with ${feedItems.length} items`
        );

        // Get the story to understand its format and preserve defaultDurationMs
        // Always read from database to get latest rssConfig with adInsertionConfig
        const story = await tx.story.findUnique({
          where: { id: storyId },
        });

        if (!story) {
          throw new Error('Story not found');
        }

        console.log(`Found story: ${story.title}, clearing existing frames...`);

        // Preserve the story's defaultDurationMs for new frames
        const defaultDurationMs = (story as any).defaultDurationMs || 5000;

        // Get existing ad frames before deleting to preserve their adConfig
        const existingAdFrames = await tx.storyFrame.findMany({
          where: { storyId, type: 'ad' },
          select: { adConfig: true },
        });

        // Save adConfigs from existing ad frames (reuse the first one if available)
        const savedAdConfig =
          existingAdFrames.length > 0 && existingAdFrames[0]?.adConfig
            ? existingAdFrames[0].adConfig
            : {
                adId: `/ad-${Date.now()}`,
                adUnitPath: '/6355419/Travel/Europe/France/Paris',
                size: [300, 250],
              };

        // Get ad insertion configuration from RSS config (always read from database)
        const rssConfig = (story as any).rssConfig as RSSConfig | null;
        const adInsertionConfig: AdInsertionConfig | undefined = rssConfig?.adInsertionConfig;

        // Clear all existing frames (including ads) when RSS updates
        const deletedCount = await tx.storyFrame.deleteMany({
          where: { storyId },
        });

        console.log(`Deleted ${deletedCount.count} existing frames`);
        console.log(`Using defaultDurationMs: ${defaultDurationMs} for new frames`);
        if (adInsertionConfig) {
          console.log(`Ad insertion config:`, JSON.stringify(adInsertionConfig));
        } else {
          console.log(`No ad insertion config found in rssConfig`);
        }

        let framesGenerated = 0;

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

          // Create frame with RSS title as name and link, preserving story's defaultDurationMs
          const frame = await tx.storyFrame.create({
            data: {
              order: i,
              type: 'story',
              hasContent: true,
              name: item.title, // Use RSS item title as frame name
              link: item.link || null, // Use RSS item link as frame link
              linkText: 'Read More', // Default link text for RSS frames
              durationMs: defaultDurationMs, // Preserve story's defaultDurationMs
              storyId,
            } as any,
          });

          console.log(`Created frame with link:`, frame.link);

          // Create background with RSS image
          if (item.imageUrl) {
            await tx.storyBackground.create({
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
          // Landscape (horizontal video player) should use 14px bold
          const fontSize = story.format === 'portrait' ? 18 : 14;
          const ctaHeight = 60; // Space reserved for CTA button
          const bottomPadding = 20; // Padding from CTA area

          // Calculate text width based on orientation only
          // - Portrait: treat like mobile; centered with side padding (10% each side)
          // - Landscape: centered with comfortable width (50%)
          const textWidth =
            story.format === 'portrait'
              ? Math.floor(frameWidth * 0.9)
              : Math.floor(frameWidth * 0.5);

          // Estimate text height based on text length and font size
          // Rough calculation: average characters per line, with line height of 1.2
          const avgCharsPerLine = textWidth / (fontSize * 0.6); // Rough character width estimation
          const estimatedLines = Math.ceil(item.title.length / avgCharsPerLine);
          const lineHeight = fontSize * 1.2;
          // Reduce overall height for landscape to occupy less vertical space
          const verticalPadding = story.format === 'landscape' ? 16 : 60;
          const minHeight = story.format === 'landscape' ? 48 : 80;
          const textHeight = Math.max(estimatedLines * lineHeight + verticalPadding, minHeight);

          // Position above CTA button area
          const textY = frameHeight - ctaHeight - textHeight - bottomPadding;

          // Compute X position (center horizontally for both orientations)
          const textX = Math.floor((frameWidth - textWidth) / 2);

          const textElement = await tx.storyElement.create({
            data: {
              type: 'text',
              x: textX,
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

        console.log(`Generated ${framesGenerated} RSS frames for story ${storyId}`);

        // Apply ad insertion rules if configured
        if (adInsertionConfig && framesGenerated > 0) {
          console.log(`Applying ad insertion strategy: ${adInsertionConfig.strategy}`);

          // Get all story frames (RSS frames) to determine ad insertion positions
          const allStoryFrames = await tx.storyFrame.findMany({
            where: { storyId, type: 'story' },
            orderBy: { order: 'asc' },
          });

          const adInsertionPositions: number[] = [];
          const totalPosts = allStoryFrames.length;

          if (adInsertionConfig.strategy === 'start-end') {
            // Insert ad at start (position 0) and end (after last post)
            adInsertionPositions.push(0); // Start
            adInsertionPositions.push(totalPosts); // After last post
          } else if (adInsertionConfig.strategy === 'alternate') {
            // Insert ad after each post
            for (let i = 1; i <= totalPosts; i++) {
              adInsertionPositions.push(i);
            }
          } else if (adInsertionConfig.strategy === 'interval') {
            const interval = adInsertionConfig.interval || 3;
            const position = adInsertionConfig.intervalPosition || 'after';

            if (position === 'before') {
              // Insert ad before every Nth post (1-indexed, so before posts 1, N+1, 2N+1, ...)
              for (let i = 1; i <= totalPosts; i += interval) {
                adInsertionPositions.push(i - 1); // Before post at index i-1
              }
            } else if (position === 'after') {
              // Insert ad after every Nth post
              for (let i = interval; i <= totalPosts; i += interval) {
                adInsertionPositions.push(i); // After post at index i
              }
            } else if (position === 'between') {
              // Insert ad between posts (after every Nth post, but not after the last if it's the last)
              for (let i = interval; i < totalPosts; i += interval) {
                adInsertionPositions.push(i); // Between posts
              }
            }
          }

          // Sort ad positions
          adInsertionPositions.sort((a, b) => a - b);

          console.log(`Ad insertion positions:`, adInsertionPositions);

          // Create ad frames at the calculated positions
          // We'll create them with temporary high order numbers, then reorder everything
          const adFrames: Array<{ id: string; targetPosition: number }> = [];
          for (const adPosition of adInsertionPositions) {
            const adFrame = await tx.storyFrame.create({
              data: {
                order: 10000 + adPosition, // Temporary high order to place after story frames
                type: 'ad',
                hasContent: false,
                name: 'Ad',
                durationMs: defaultDurationMs,
                storyId,
                adConfig: savedAdConfig as any,
              } as any,
            });

            adFrames.push({ id: adFrame.id, targetPosition: adPosition });
            console.log(
              `Created ad frame ${adFrame.id} at temporary order ${adFrame.order}, target position ${adPosition}`
            );
          }

          // Build the final ordered list: story frames and ads interleaved
          const finalOrder: Array<{ id: string; type: string }> = [];

          if (adInsertionConfig.strategy === 'start-end') {
            // [Ad, story, story, ..., story, Ad]
            // Insert ad at start (position 0)
            const startAd = adFrames.find((ad) => ad.targetPosition === 0);
            if (startAd) {
              finalOrder.push({ id: startAd.id, type: 'ad' });
            }
            // Add all story frames
            for (const storyFrame of allStoryFrames) {
              finalOrder.push({ id: storyFrame.id, type: 'story' });
            }
            // Insert ad at end (position totalPosts)
            const endAd = adFrames.find((ad) => ad.targetPosition === totalPosts);
            if (endAd) {
              finalOrder.push({ id: endAd.id, type: 'ad' });
            }
          } else if (adInsertionConfig.strategy === 'alternate') {
            // [story, ad, story, ad, story, ad]
            for (let i = 0; i < allStoryFrames.length; i++) {
              const storyFrame = allStoryFrames[i];
              if (storyFrame) {
                // Add story frame
                finalOrder.push({ id: storyFrame.id, type: 'story' });
                // Add ad after each story (except maybe the last, but we'll add it)
                const adPosition = i + 1; // Position 1, 2, 3, ...
                const adFrame = adFrames.find((ad) => ad.targetPosition === adPosition);
                if (adFrame) {
                  finalOrder.push({ id: adFrame.id, type: 'ad' });
                }
              }
            }
          } else if (adInsertionConfig.strategy === 'interval') {
            const interval = adInsertionConfig.interval || 3;
            const position = adInsertionConfig.intervalPosition || 'after';

            if (position === 'before') {
              // [Ad, story, story, story, Ad, story, story, story]
              // Insert ad before every Nth story (before stories at indices 0, interval, 2*interval, ...)
              for (let i = 0; i < allStoryFrames.length; i++) {
                const storyFrame = allStoryFrames[i];
                if (!storyFrame) continue;

                if (i % interval === 0 && i > 0) {
                  // Insert ad before this story
                  const adPosition = i; // Before story at index i
                  const adFrame = adFrames.find((ad) => ad.targetPosition === adPosition);
                  if (adFrame) {
                    finalOrder.push({ id: adFrame.id, type: 'ad' });
                  }
                }
                // Add story frame
                finalOrder.push({ id: storyFrame.id, type: 'story' });
              }
              // Also check if we need an ad at the very start (position 0)
              const startAd = adFrames.find((ad) => ad.targetPosition === 0);
              if (startAd) {
                finalOrder.unshift({ id: startAd.id, type: 'ad' });
              }
            } else if (position === 'after') {
              // [story, story, story, Ad, story, story, story, Ad]
              // Insert ad after every Nth story
              for (let i = 0; i < allStoryFrames.length; i++) {
                const storyFrame = allStoryFrames[i];
                if (!storyFrame) continue;

                // Add story frame
                finalOrder.push({ id: storyFrame.id, type: 'story' });
                // Insert ad after every Nth story (after stories at indices interval-1, 2*interval-1, ...)
                if ((i + 1) % interval === 0) {
                  const adPosition = i + 1; // After story at index i
                  const adFrame = adFrames.find((ad) => ad.targetPosition === adPosition);
                  if (adFrame) {
                    finalOrder.push({ id: adFrame.id, type: 'ad' });
                  }
                }
              }
            } else if (position === 'between') {
              // [story, story, Ad, story, story, story, Ad, story]
              // Insert ad between every N stories (not after the last)
              for (let i = 0; i < allStoryFrames.length; i++) {
                const storyFrame = allStoryFrames[i];
                if (!storyFrame) continue;

                // Add story frame
                finalOrder.push({ id: storyFrame.id, type: 'story' });
                // Insert ad between every N stories (after stories at indices interval-1, 2*interval-1, ...)
                // But not after the last story
                if ((i + 1) % interval === 0 && i < allStoryFrames.length - 1) {
                  const adPosition = i + 1; // After story at index i
                  const adFrame = adFrames.find((ad) => ad.targetPosition === adPosition);
                  if (adFrame) {
                    finalOrder.push({ id: adFrame.id, type: 'ad' });
                  }
                }
              }
            }
          }

          // Update all frame orders based on final order using batch updates
          // Use Promise.all for parallel updates within transaction
          const updatePromises = finalOrder.map((frame, newOrder) => {
            if (!frame || !frame.id) {
              console.warn(`Skipping invalid frame at order ${newOrder}:`, frame);
              return Promise.resolve();
            }
            return tx.storyFrame.update({
              where: { id: frame.id },
              data: { order: newOrder },
            });
          });

          await Promise.all(updatePromises);

          console.log(
            `Inserted ${adFrames.length} ad frames and reordered ${finalOrder.length} total frames`
          );
        }

        // Final verification - check if frames were actually saved
        const verificationFrames = await tx.storyFrame.findMany({
          where: { storyId },
          select: { id: true, name: true, link: true, linkText: true, type: true, order: true },
          orderBy: { order: 'asc' },
        });

        console.log(
          `Final verification - ${verificationFrames.length} frames in database:`,
          verificationFrames.map((frame: any) => ({
            id: frame.id,
            name: frame.name,
            type: frame.type,
            order: frame.order,
            link: frame.link,
            linkText: frame.linkText,
            hasLink: !!frame.link,
            hasLinkText: !!frame.linkText,
          }))
        );

        // Verify no duplicate orders
        const orders = verificationFrames.map((f: any) => f.order);
        const uniqueOrders = new Set(orders);
        if (orders.length !== uniqueOrders.size) {
          console.error('ERROR: Duplicate orders detected!', orders);
          throw new Error('Duplicate frame orders detected after generation');
        }

        return framesGenerated;
      } catch (error) {
        console.error('Error generating frames from RSS:', error);
        throw error;
      }
    });
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

  // Admin methods - bypass ownership checks

  // Get story by ID as admin (no ownership check)
  static async getStoryByIdAsAdmin(storyId: string): Promise<Story | null> {
    const story = await prisma.story.findFirst({
      where: { id: storyId },
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

  // Update story as admin (no ownership check)
  static async updateStoryAsAdmin(storyId: string, data: UpdateStoryRequest): Promise<Story> {
    // Whitelist only valid columns for Story update
    const updateData: any = {};
    if (typeof (data as any).title !== 'undefined') updateData.title = (data as any).title;
    if (typeof (data as any).publisherName !== 'undefined')
      updateData.publisherName = (data as any).publisherName;
    if (typeof (data as any).publisherPic !== 'undefined')
      updateData.publisherPic = (data as any).publisherPic;
    if (typeof (data as any).ctaType !== 'undefined') updateData.ctaType = (data as any).ctaType;
    if (typeof (data as any).ctaValue !== 'undefined') updateData.ctaValue = (data as any).ctaValue;
    if (typeof (data as any).ctaText !== 'undefined') updateData.ctaText = (data as any).ctaText;
    if (typeof (data as any).status !== 'undefined') updateData.status = (data as any).status;
    if (typeof (data as any).format !== 'undefined') updateData.format = (data as any).format;
    if (typeof (data as any).deviceFrame !== 'undefined')
      updateData.deviceFrame = (data as any).deviceFrame;
    if (typeof (data as any).storyType !== 'undefined')
      updateData.storyType = (data as any).storyType;
    if (typeof (data as any).defaultDurationMs !== 'undefined')
      updateData.defaultDurationMs = (data as any).defaultDurationMs;
    if (typeof (data as any).cpm !== 'undefined') updateData.cpm = (data as any).cpm;
    // Allow admins to reassign story to different user
    if (typeof (data as any).userId !== 'undefined') updateData.userId = (data as any).userId;
    if (typeof (data as any).rssConfig !== 'undefined') {
      updateData.rssConfig = (data as any).rssConfig
        ? JSON.parse(JSON.stringify((data as any).rssConfig))
        : null;
    }
    if (typeof (data as any).embedConfig !== 'undefined') {
      updateData.embedConfig = (data as any).embedConfig
        ? JSON.parse(JSON.stringify((data as any).embedConfig))
        : null;
    }

    const story = await prisma.story.update({
      where: {
        id: storyId,
      },
      data: updateData,
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

  // Delete story as admin (no ownership check)
  static async deleteStoryAsAdmin(storyId: string): Promise<void> {
    // First cancel any scheduled RSS updates and clear status
    try {
      const { SchedulerService } = await import('./schedulerService');
      const scheduler = new SchedulerService();
      await scheduler.cancelRSSUpdates(storyId);
      await scheduler.clearProcessingStatus(storyId);
    } catch (e) {
      console.warn('Warning: failed to cancel RSS updates for deleted story', storyId, e);
    }

    await prisma.story.delete({
      where: {
        id: storyId,
      },
    });
  }

  // Create story frame as admin (no ownership check)
  static async createStoryFrameAsAdmin(
    storyId: string,
    data: CreateStoryFrameRequest
  ): Promise<StoryFrame> {
    // Verify story exists (but don't check ownership)
    await prisma.story.findFirstOrThrow({
      where: { id: storyId },
    });

    const frameData: any = {
      order: data.order,
      hasContent: data.hasContent || false,
      name: data.name || null,
      link: data.link || null,
      linkText: data.linkText || null,
      storyId,
    };

    if (typeof (data as any).type !== 'undefined') {
      frameData.type = (data as any).type;
    }
    if (typeof (data as any).adConfig !== 'undefined') {
      frameData.adConfig = (data as any).adConfig;
    }
    if (typeof (data as any).durationMs !== 'undefined') {
      frameData.durationMs = (data as any).durationMs;
    }

    const frame = await prisma.storyFrame.create({
      data: frameData,
      include: {
        elements: true,
        background: true,
      },
    });

    return frame as unknown as StoryFrame;
  }

  // Update story frame as admin (no ownership check)
  static async updateStoryFrameAsAdmin(
    frameId: string,
    data: UpdateStoryFrameRequest
  ): Promise<StoryFrame> {
    // Verify frame exists (but don't check ownership)
    await prisma.storyFrame.findFirstOrThrow({
      where: { id: frameId },
    });

    const updateData: any = {};
    if (typeof (data as any).name !== 'undefined') updateData.name = (data as any).name;
    if (typeof (data as any).link !== 'undefined') updateData.link = (data as any).link;
    if (typeof (data as any).linkText !== 'undefined') updateData.linkText = (data as any).linkText;
    if (typeof (data as any).order !== 'undefined') updateData.order = (data as any).order;
    if (typeof (data as any).hasContent !== 'undefined')
      updateData.hasContent = (data as any).hasContent;
    if (typeof (data as any).adConfig !== 'undefined') updateData.adConfig = (data as any).adConfig;
    if (typeof (data as any).durationMs !== 'undefined')
      updateData.durationMs = (data as any).durationMs;

    const frame = await prisma.storyFrame.update({
      where: { id: frameId },
      data: updateData,
      include: {
        elements: true,
        background: true,
      },
    });

    return frame as unknown as StoryFrame;
  }

  // Delete story frame as admin (no ownership check)
  static async deleteStoryFrameAsAdmin(frameId: string): Promise<void> {
    await prisma.storyFrame.delete({
      where: { id: frameId },
    });
  }

  // Create story element as admin (no ownership check)
  static async createStoryElementAsAdmin(
    frameId: string,
    data: CreateStoryElementRequest
  ): Promise<StoryElement> {
    // Verify frame exists (but don't check ownership)
    await prisma.storyFrame.findFirstOrThrow({
      where: { id: frameId },
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

  // Update story element as admin (no ownership check)
  static async updateStoryElementAsAdmin(
    elementId: string,
    data: UpdateStoryElementRequest
  ): Promise<StoryElement> {
    const element = await prisma.storyElement.update({
      where: { id: elementId },
      data,
    });

    return element as unknown as StoryElement;
  }

  // Delete story element as admin (no ownership check)
  static async deleteStoryElementAsAdmin(elementId: string): Promise<void> {
    await prisma.storyElement.delete({
      where: { id: elementId },
    });
  }

  // Create or update story background as admin (no ownership check)
  static async upsertStoryBackgroundAsAdmin(
    frameId: string,
    data: CreateStoryBackgroundRequest
  ): Promise<StoryBackground> {
    // Verify frame exists (but don't check ownership)
    await prisma.storyFrame.findFirstOrThrow({
      where: { id: frameId },
    });

    const background = await prisma.storyBackground.upsert({
      where: { frameId },
      update: data,
      create: {
        ...data,
        frameId,
      },
    });

    return background as unknown as StoryBackground;
  }

  // Delete story background as admin (no ownership check)
  static async deleteStoryBackgroundAsAdmin(frameId: string): Promise<void> {
    await prisma.storyBackground.delete({
      where: { frameId },
    });
  }

  // Save complete story as admin (can save any story)
  static async saveCompleteStoryAsAdmin(adminUserId: string, storyData: any): Promise<Story> {
    const { story, frames } = storyData;
    console.log(
      'Backend received frames (admin):',
      frames.map((f: any) => ({ id: f.id, name: f.name, type: f.type }))
    );

    // Update or create story (admin can update any story)
    let dbStory: Story;
    if (story.id) {
      // Update existing story (admin can update any story)
      dbStory = await this.updateStoryAsAdmin(story.id, story);
    } else if (story.uniqueId) {
      // Try to find story by uniqueId and update it (admin can update any story)
      const existingStory = await this.getStoryByUniqueId(story.uniqueId);
      if (existingStory) {
        dbStory = await this.updateStoryAsAdmin(existingStory.id, story);
      } else {
        // Create new story with the provided uniqueId
        dbStory = await this.createStory(adminUserId, story);
      }
    } else {
      // Create new story
      dbStory = await this.createStory(adminUserId, story);
    }

    // Clear existing frames and recreate them
    await prisma.storyFrame.deleteMany({
      where: {
        storyId: dbStory.id,
      },
    });

    // Create frames with elements and backgrounds
    for (const frame of frames) {
      console.log('Creating frame with name (admin):', frame.name);
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
      console.log('Created frame (admin):', { id: dbFrame.id, name: dbFrame.name });

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
    return (await this.getStoryByIdAsAdmin(dbStory.id)) as Story;
  }
}
