import Parser from 'rss-parser';
import axios from 'axios';
import { RSSFeedItem, RSSConfig } from '@snappy/shared-types';

export class RSSService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
          ['enclosure', 'enclosure', { keepArray: true }],
        ],
      },
    });
  }

  /**
   * Fetch and parse RSS feed
   */
  async fetchFeed(feedUrl: string): Promise<RSSFeedItem[]> {
    try {
      console.log(`Fetching RSS feed from: ${feedUrl}`);

      // Parse the RSS feed
      const feed = await this.parser.parseURL(feedUrl);

      if (!feed.items || feed.items.length === 0) {
        throw new Error('No items found in RSS feed');
      }

      // Convert feed items to our format
      const feedItems: RSSFeedItem[] = feed.items.map((item) => {
        let imageUrl: string | undefined;

        // Try to extract image from various sources
        if (item['mediaContent'] && item['mediaContent'].length > 0) {
          const mediaItem = item['mediaContent'].find((media: any) =>
            media.$.type?.startsWith('image/')
          );
          if (mediaItem) {
            imageUrl = mediaItem.$.url;
          }
        }

        if (!imageUrl && item['mediaThumbnail'] && item['mediaThumbnail'].length > 0) {
          imageUrl = item['mediaThumbnail'][0].$.url;
        }

        // Handle enclosure tags (for Times of India RSS)
        if (!imageUrl && item.enclosure) {
          if (Array.isArray(item.enclosure)) {
            const imageEnclosure = item.enclosure.find(
              (enc: any) => enc.$ && enc.$.type && enc.$.type.startsWith('image/')
            );
            if (imageEnclosure && imageEnclosure.$) {
              imageUrl = imageEnclosure.$.url;
            }
          } else if (
            item.enclosure.$ &&
            item.enclosure.$.type &&
            item.enclosure.$.type.startsWith('image/')
          ) {
            // Single enclosure object
            imageUrl = item.enclosure.$.url;
          }
        }

        // Try built-in enclosure field from rss-parser
        if (!imageUrl && (item as any).enclosure) {
          const enclosure = (item as any).enclosure;
          if (enclosure.type && enclosure.type.startsWith('image/')) {
            imageUrl = enclosure.url;
          }
        }

        // Try to extract image from description HTML
        if (!imageUrl && item.contentSnippet) {
          const imgMatch = item.contentSnippet.match(/<img[^>]+src="([^"]+)"/i);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }

        return {
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.content || '',
          link: item.link || '',
          imageUrl: imageUrl || '',
          pubDate: item.pubDate || '',
          guid: item.guid || '',
        };
      });

      console.log(`Successfully parsed ${feedItems.length} items from RSS feed`);
      return feedItems;
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      throw new Error(
        `Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate RSS feed URL
   */
  async validateFeedUrl(feedUrl: string): Promise<boolean> {
    try {
      await this.fetchFeed(feedUrl);
      return true;
    } catch (error) {
      console.error('RSS feed validation failed:', error);
      return false;
    }
  }

  /**
   * Get feed items with repetition if needed
   */
  async getFeedItemsForStory(config: RSSConfig): Promise<RSSFeedItem[]> {
    const feedItems = await this.fetchFeed(config.feedUrl);

    if (feedItems.length >= config.maxPosts) {
      return feedItems.slice(0, config.maxPosts);
    }

    if (config.allowRepetition) {
      // Repeat items to reach maxPosts
      const repeatedItems: RSSFeedItem[] = [];
      let currentIndex = 0;

      while (repeatedItems.length < config.maxPosts) {
        if (currentIndex >= feedItems.length) {
          currentIndex = 0; // Reset to beginning
        }
        const item = feedItems[currentIndex];
        if (item) {
          repeatedItems.push(item);
        }
        currentIndex++;
      }

      return repeatedItems;
    }

    // Return available items without repetition
    return feedItems;
  }

  /**
   * Download and validate image URL
   */
  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await axios.head(imageUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Snappy RSS Bot)',
        },
      });

      const contentType = response.headers['content-type'];
      return contentType?.startsWith('image/') || false;
    } catch (error) {
      console.error('Image validation failed:', error);
      return false;
    }
  }

  /**
   * Get next update time based on interval
   */
  getNextUpdateTime(intervalMinutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + intervalMinutes * 60 * 1000);
  }

  /**
   * Check if feed needs update
   */
  needsUpdate(_lastUpdated: string, intervalMinutes: number): boolean {
    const nextUpdateTime = this.getNextUpdateTime(intervalMinutes);
    return new Date() >= nextUpdateTime;
  }
}
