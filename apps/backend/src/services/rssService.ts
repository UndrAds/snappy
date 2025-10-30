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
          // Debug logging for mediaContent structure
          console.log('Found mediaContent:', JSON.stringify(item['mediaContent'], null, 2));

          // First, try to find media:content with image type or medium="image"
          const mediaItem = item['mediaContent'].find((media: any) => {
            if (!media.$) {
              // Check if URL is directly on the media object
              if (media.url) return true;
              return false;
            }
            // Check for type starting with "image/"
            if (media.$.type?.startsWith('image/')) return true;
            // Check for medium="image" attribute
            if (media.$.medium === 'image') return true;
            // Check for type="image" (some feeds use this)
            if (media.$.type === 'image') return true;
            // Check if there's a URL attribute (might be an image by default)
            if (media.$.url) return true;
            return false;
          });

          if (mediaItem) {
            // Try different possible URL locations
            imageUrl =
              mediaItem.$?.url || mediaItem.$?.['media:url'] || mediaItem.url || mediaItem.$?.src;

            // Debug logging
            if (imageUrl) {
              console.log('Found image URL from mediaContent:', imageUrl);
            } else {
              console.log('mediaContent found but no URL:', JSON.stringify(mediaItem, null, 2));
            }
          }

          // If still no image, try to find any media:content with a URL (fallback)
          if (!imageUrl) {
            const anyMediaItem = item['mediaContent'].find((media: any) => {
              if (media.$) {
                return media.$.url || media.$['media:url'] || media.$.src;
              }
              return media.url || media.src;
            });
            if (anyMediaItem) {
              imageUrl =
                anyMediaItem.$?.url ||
                anyMediaItem.$?.['media:url'] ||
                anyMediaItem.$?.src ||
                anyMediaItem.url ||
                anyMediaItem.src;
              if (imageUrl) {
                console.log('Found image URL from mediaContent (fallback):', imageUrl);
              }
            }
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
            (item.enclosure as any).$ &&
            (item.enclosure as any).$.type &&
            (item.enclosure as any).$.type.startsWith('image/')
          ) {
            // Single enclosure object
            imageUrl = (item.enclosure as any).$.url;
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

        const feedItem = {
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.content || '',
          link: item.link || '',
          imageUrl: imageUrl || '',
          pubDate: item.pubDate || '',
          guid: item.guid || '',
        };

        // Debug logging for RSS item parsing
        console.log(`RSS Item parsed:`, {
          title: feedItem.title,
          link: feedItem.link,
          hasLink: !!feedItem.link,
          imageUrl: feedItem.imageUrl,
          hasImage: !!feedItem.imageUrl,
        });

        return feedItem;
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
