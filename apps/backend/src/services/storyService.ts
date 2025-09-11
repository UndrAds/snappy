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
} from '@snappy/shared-types';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to convert Prisma story to shared types format
function convertPrismaStoryToSharedType(prismaStory: any): Story {
  return {
    ...prismaStory,
    createdAt: prismaStory.createdAt.toISOString(),
    updatedAt: prismaStory.updatedAt.toISOString(),
    frames: prismaStory.frames?.map((frame: any) => ({
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
        format: data.format || 'portrait',
        deviceFrame: data.deviceFrame || 'mobile',
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

    return stories.map((story) => convertPrismaStoryToSharedType(story));
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
      data,
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
}
