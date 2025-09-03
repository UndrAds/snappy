import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  headlines: string[];
  images: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  title: string;
  description?: string;
}

export class ContentScraperService {
  /**
   * Scrape content from a website URL
   */
  async scrapeWebsite(url: string): Promise<ScrapedContent> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      // Fetch the webpage
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract title
      const title =
        $('title').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        $('h1').first().text().trim() ||
        'Untitled';

      // Extract description
      const description =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        $('p').first().text().trim();

      // Extract headlines (h1, h2, h3, h4)
      const headlines: string[] = [];
      $('h1, h2, h3, h4').each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 10 && text.length < 200 && !headlines.includes(text)) {
          headlines.push(text);
        }
      });

      // If no headlines found, try to extract from other elements
      if (headlines.length === 0) {
        $('h5, h6, .title, .headline, [class*="title"], [class*="headline"]').each((_, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 10 && text.length < 200 && !headlines.includes(text)) {
            headlines.push(text);
          }
        });
      }

      // If still no headlines, try to extract from strong/b elements that might be titles
      if (headlines.length === 0) {
        $('strong, b, .title, .heading').each((_, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 10 && text.length < 200 && !headlines.includes(text)) {
            headlines.push(text);
          }
        });
      }

      // Extract images
      const images: Array<{ url: string; alt: string; width?: number; height?: number }> = [];
      $('img').each((_, element) => {
        const $img = $(element);
        const src = $img.attr('src');
        const alt = $img.attr('alt') || '';
        const width = parseInt($img.attr('width') || '0');
        const height = parseInt($img.attr('height') || '0');

        if (src && this.isValidImageUrl(src)) {
          // Convert relative URLs to absolute URLs
          const absoluteUrl = this.resolveUrl(url, src);
          if (absoluteUrl) {
            images.push({
              url: absoluteUrl,
              alt,
              width: width || undefined,
              height: height || undefined,
            } as any);
          }
        }
      });

      // Also try to extract images from data-src and other attributes
      $('img[data-src], img[data-lazy], img[data-original]').each((_, element) => {
        const $img = $(element);
        const src = $img.attr('data-src') || $img.attr('data-lazy') || $img.attr('data-original');
        const alt = $img.attr('alt') || '';

        if (src && this.isValidImageUrl(src)) {
          const absoluteUrl = this.resolveUrl(url, src);
          if (absoluteUrl) {
            images.push({
              url: absoluteUrl,
              alt,
              width: undefined,
              height: undefined,
            } as any);
          }
        }
      });

      // Filter out duplicate images and very small images
      const uniqueImages = images
        .filter((img, index, self) => index === self.findIndex((t) => t.url === img.url))
        .filter((img) => (!img.width || img.width > 100) && (!img.height || img.height > 100));

      return {
        headlines: headlines.slice(0, 20), // Limit to 20 headlines
        images: uniqueImages.slice(0, 50), // Limit to 50 images
        title,
        description,
      };
    } catch (error) {
      console.error('Error scraping website:', error);
      throw new Error(
        `Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate if the provided string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate if the provided string is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return (
      imageExtensions.some((ext) => lowerUrl.includes(ext)) ||
      lowerUrl.includes('data:image') ||
      lowerUrl.includes('blob:')
    );
  }

  /**
   * Resolve relative URLs to absolute URLs
   */
  private resolveUrl(baseUrl: string, relativeUrl: string): string | null {
    try {
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }

      if (relativeUrl.startsWith('//')) {
        return `https:${relativeUrl}`;
      }

      if (relativeUrl.startsWith('/')) {
        const url = new URL(baseUrl);
        return `${url.protocol}//${url.host}${relativeUrl}`;
      }

      if (relativeUrl.startsWith('./') || relativeUrl.startsWith('../')) {
        return new URL(relativeUrl, baseUrl).href;
      }

      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return null;
    }
  }
}

export default new ContentScraperService();
