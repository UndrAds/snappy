import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Story, StoryFrame } from '@snappy/shared-types';
import { S3Service } from './s3Service';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import archiver from 'archiver';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { minify: minifyHTML } = require('html-minifier-terser');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { minify: minifyCSSLib } = require('csso');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { minify: minifyJSLib } = require('terser');

export interface ExportOptions {
  exportType: 'standard' | 'app-campaigns'; // Standard Display Network or App Campaigns
  destinationUrl: string; // Click destination URL for the ad
}

export interface ExportResult {
  zipPath: string;
  fileSize: number;
  fileCount: number;
  warnings: string[];
}

export class ExportService {
  /**
   * Export story to Google H5 Ads format
   */
  static async exportToH5Ads(story: Story, options: ExportOptions): Promise<ExportResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snappy-export-'));
    const warnings: string[] = [];

    try {
      // Filter frames: remove ad frames, keep only story frames
      const storyFrames = (story.frames || []).filter((frame) => frame.type === 'story');

      if (storyFrames.length === 0) {
        throw new Error('No story frames found. Ad frames are excluded from H5 exports.');
      }

      // Collect all image URLs
      const imageUrls = new Set<string>();

      // Publisher pic
      if (story.publisherPic) {
        imageUrls.add(story.publisherPic);
        console.log(`[Export] Added publisher pic: ${story.publisherPic}`);
      }

      // Story thumbnails (for static stories)
      if (story.largeThumbnail) {
        imageUrls.add(story.largeThumbnail);
        console.log(`[Export] Added large thumbnail: ${story.largeThumbnail}`);
      }
      if (story.smallThumbnail) {
        imageUrls.add(story.smallThumbnail);
        console.log(`[Export] Added small thumbnail: ${story.smallThumbnail}`);
      }

      // Frame backgrounds and elements
      storyFrames.forEach((frame, frameIndex) => {
        if (frame.background?.type === 'image' && frame.background.value) {
          imageUrls.add(frame.background.value);
          console.log(`[Export] Added frame ${frameIndex} background image: ${frame.background.value}`);
        }
        frame.elements?.forEach((element, elementIndex) => {
          if (element.type === 'image' && element.mediaUrl) {
            imageUrls.add(element.mediaUrl);
            console.log(`[Export] Added frame ${frameIndex} element ${elementIndex} image: ${element.mediaUrl}`);
          }
        });
      });

      console.log(`[Export] Total unique image URLs collected: ${imageUrls.size}`);

      // Download and compress images
      const imageMap = new Map<string, string>(); // original URL -> local filename
      let imageIndex = 0;

      for (const imageUrl of imageUrls) {
        try {
          // Skip empty or invalid URLs
          if (!imageUrl || imageUrl.trim() === '') {
            continue;
          }

          const imageData = await this.downloadImage(imageUrl);

          // Validate image data (must have content and be a valid image)
          if (!imageData || imageData.length === 0) {
            warnings.push(`Skipping empty image: ${imageUrl}`);
            continue;
          }

          // Check if it's a valid image format (check magic bytes)
          const isValidImage = this.validateImageData(imageData);
          if (!isValidImage) {
            warnings.push(`Skipping invalid/corrupted image: ${imageUrl}`);
            continue;
          }

          const compressedImage = await this.compressImage(imageData);

          // Validate compressed image
          if (!compressedImage || compressedImage.length === 0) {
            warnings.push(`Skipping image after compression failed: ${imageUrl}`);
            continue;
          }

          const ext = this.getImageExtension(imageUrl);
          const filename = `img${imageIndex++}${ext}`;
          const localPath = path.join(tempDir, filename);

          fs.writeFileSync(localPath, compressedImage);
          imageMap.set(imageUrl, filename);
          console.log(`[Export] Successfully downloaded and saved image: ${imageUrl} -> ${filename} (${compressedImage.length} bytes)`);
        } catch (error: any) {
          const errorMsg = `Failed to download/compress image: ${imageUrl} - ${error.message}`;
          warnings.push(errorMsg);
          console.error(`[Export] ${errorMsg}`);
        }
      }

      // Generate HTML5 files (all inline in single HTML file)
      const isDynamicStory = story.storyType === 'dynamic';
      const html = this.generateHTML(story, storyFrames, imageMap, options, isDynamicStory);

      // Minify HTML (CSS and JS are already inlined, so we only minify HTML)
      const minifiedHTML = await this.minifyHTML(html);

      // Write single HTML file
      fs.writeFileSync(path.join(tempDir, 'index.html'), minifiedHTML);

      // Create ZIP file
      const zipPath = path.join(tempDir, 'story.zip');
      const filesToZip = ['index.html', ...Array.from(imageMap.values())];
      
      // Log files being added to ZIP for debugging
      console.log(`[Export] Adding ${filesToZip.length} files to ZIP:`, filesToZip);
      console.log(`[Export] Image map size: ${imageMap.size}, Image URLs collected: ${imageUrls.size}`);
      
      await this.createZip(tempDir, zipPath, filesToZip);

      // Get file size and count
      const stats = fs.statSync(zipPath);
      const fileSize = stats.size;
      const fileCount = 1 + imageMap.size; // HTML + images

      // Validate constraints
      const maxSize = options.exportType === 'app-campaigns' ? 5 * 1024 * 1024 : 600 * 1024; // 5MB or 600KB
      const maxFiles = options.exportType === 'app-campaigns' ? 512 : 40;

      if (fileSize > maxSize) {
        warnings.push(
          `File size (${(fileSize / 1024).toFixed(2)} KB) exceeds limit (${(maxSize / 1024).toFixed(2)} KB)`
        );
      }

      if (fileCount > maxFiles) {
        warnings.push(`File count (${fileCount}) exceeds limit (${maxFiles})`);
      }

      return {
        zipPath,
        fileSize,
        fileCount,
        warnings,
      };
    } catch (error: any) {
      // Cleanup on error
      this.cleanup(tempDir);
      throw error;
    }
  }

  /**
   * Cleanup export files after download (called by controller)
   */
  static cleanupExport(zipPath: string): void {
    try {
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        // Also cleanup parent temp directory
        const tempDir = path.dirname(zipPath);
        if (
          fs.existsSync(tempDir) &&
          (tempDir.includes('snappy-export-') ||
            tempDir.includes(path.join(os.tmpdir(), 'snappy-export-')))
        ) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup export files:', error);
    }
  }

  /**
   * Download image from URL (S3 or external)
   */
  private static async downloadImage(url: string): Promise<Buffer> {
    // Check if it's an S3 URL
    if (S3Service.isS3Url(url)) {
      const key = S3Service.extractKeyFromUrl(url);
      if (!key) {
        throw new Error('Invalid S3 URL');
      }

      // Create S3 client
      const s3Client = new S3Client({
        region: process.env['AWS_REGION'] || 'us-east-1',
        credentials: {
          accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
          secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env['S3_BUCKET_NAME']!,
        Key: key,
      });

      const response = await s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      if (chunks.length === 0) {
        throw new Error('Empty response body from S3');
      }

      return Buffer.concat(chunks);
    } else {
      // External URL
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    }
  }

  /**
   * Compress image using sharp
   */
  private static async compressImage(imageData: Buffer): Promise<Buffer> {
    try {
      // Compress image to JPEG with quality 85
      const compressed = await sharp(imageData).jpeg({ quality: 85, mozjpeg: true }).toBuffer();

      // If compressed is smaller, use it; otherwise use original
      return compressed.length < imageData.length ? compressed : imageData;
    } catch (error) {
      // If compression fails, return original
      console.warn('Image compression failed, using original:', error);
      return imageData;
    }
  }

  /**
   * Get image extension from URL
   */
  private static getImageExtension(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    return match && match[1] ? `.${match[1].toLowerCase()}` : '.jpg';
  }

  /**
   * Validate image data by checking magic bytes (file signatures)
   */
  private static validateImageData(imageData: Buffer): boolean {
    if (!imageData || imageData.length < 4) {
      return false;
    }

    // Check for common image format magic bytes
    const bytes = Array.from(imageData.slice(0, 12));

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return true;
    }

    // GIF: 47 49 46 38 (GIF8)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return true;
    }

    // WebP: Check for RIFF...WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return true;
    }

    // If none match, it's likely not a valid image
    return false;
  }

  /**
   * Generate HTML5 content (with inline CSS and JS)
   */
  private static generateHTML(
    story: Story,
    frames: StoryFrame[],
    imageMap: Map<string, string>,
    options: ExportOptions,
    isDynamicStory: boolean = false
  ): string {
    // Generate HTML without mobile frame, without ads, without external links
    const framesHTML = frames
      .map((frame, index) => {
        return this.generateFrameHTML(frame, index, imageMap, isDynamicStory);
      })
      .join('\n');

    const css = this.generateCSS(story, options);
    const js = this.generateJS(story, frames, options);

    // Get dimensions for ad.size meta tag
    const format = story.format || 'portrait';
    const deviceFrame = story.deviceFrame || 'mobile';
    let adWidth: number;
    let adHeight: number;

    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        adWidth = 288;
        adHeight = 550;
      } else {
        adWidth = 320;
        adHeight = 600;
      }
    } else {
      if (deviceFrame === 'mobile') {
        adWidth = 400;
        adHeight = 225;
      } else {
        adWidth = 480;
        adHeight = 270;
      }
    }

    // Escape destination URL for JavaScript (escape quotes, backslashes, and newlines)
    const escapedUrl = options.destinationUrl
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');

    // Generate progress bar HTML
    const progressBarHTML = this.generateProgressBar(frames.length);
    
    // Generate publisher header HTML
    const publisherHeaderHTML = this.generatePublisherHeader(story, imageMap);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="ad.size" content="width=${adWidth},height=${adHeight}">
  <title>${this.escapeHtml(story.title || 'Story')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${css}
  </style>
  <script type="text/javascript">
var clickTag = "${escapedUrl}";
  </script>
</head>
<body>
  <a href="javascript:void(window.open(clickTag))">
    <div class="story-container">
      ${progressBarHTML}
      ${publisherHeaderHTML}
      ${framesHTML}
    </div>
  </a>
  <script>
${js}
  </script>
</body>
</html>`;
  }

  /**
   * Generate progress bar HTML
   */
  private static generateProgressBar(totalFrames: number): string {
    const bars = Array.from({ length: totalFrames }, (_, i) => {
      return `<div class="progress-bar-item" data-frame-index="${i}">
        <div class="progress-bar-fill" data-frame-index="${i}"></div>
      </div>`;
    }).join('');

    return `<div class="progress-bar-container">${bars}</div>`;
  }

  /**
   * Generate publisher header HTML
   */
  private static generatePublisherHeader(
    story: Story,
    imageMap: Map<string, string>
  ): string {
    const publisherPic = story.publisherPic;
    const publisherPicLocal = publisherPic ? imageMap.get(publisherPic) : null;
    const publisherName = this.escapeHtml(story.publisherName || '');
    const storyTitle = this.escapeHtml(story.title || '');

    const picHTML = publisherPicLocal
      ? `<img src="${this.escapeHtml(publisherPicLocal)}" alt="Publisher" class="publisher-pic" />`
      : '<div class="publisher-pic-placeholder">PP</div>';

    return `<div class="publisher-header">
      ${picHTML}
      <div class="publisher-info">
        <div class="publisher-name">${publisherName}</div>
        <div class="story-title">${storyTitle}</div>
      </div>
      <div class="frame-counter">
        <span class="current-frame">1</span>/<span class="total-frames">${story.frames?.filter(f => f.type === 'story').length || 1}</span>
      </div>
    </div>`;
  }

  /**
   * Generate frame HTML (no external links, clickable for navigation)
   */
  private static generateFrameHTML(
    frame: StoryFrame,
    index: number,
    imageMap: Map<string, string>,
    isDynamicStory: boolean = false
  ): string {
    const backgroundHTML = this.getFrameBackgroundHTML(frame, imageMap);
    const elementsHTML = (frame.elements || [])
      .map((element) => this.generateElementHTML(element, imageMap, isDynamicStory))
      .join('\n');

    // No external links - removed CTA button
    // Frame is clickable for navigation

    return `
    <div class="frame" data-frame-index="${index}" data-duration="${frame.durationMs || 2500}">
      ${backgroundHTML}
      <div class="frame-content">
        ${elementsHTML}
      </div>
    </div>`;
  }

  /**
   * Get frame background HTML (matches embed UI: blurred background + contained main image)
   */
  private static getFrameBackgroundHTML(frame: StoryFrame, imageMap: Map<string, string>): string {
    if (!frame.background) {
      return '<div class="frame-background" style="background: linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316);"></div>';
    }

    if (frame.background.type === 'color') {
      return `<div class="frame-background" style="background: ${this.escapeHtml(frame.background.value)};"></div>`;
    }

    if (frame.background.type === 'image' && frame.background.value) {
      const localFile = imageMap.get(frame.background.value);
      if (localFile) {
        // Get background properties
        const opacity = frame.background.opacity !== undefined ? frame.background.opacity / 100 : 1;
        const zoom = frame.background.zoom !== undefined ? frame.background.zoom / 100 : 1;
        const rotation = frame.background.rotation || 0;
        const offsetX = frame.background.offsetX || 0;
        const offsetY = frame.background.offsetY || 0;
        const filter = frame.background.filter ? this.getFilterCSS(frame.background.filter) : '';

        // Build transform for main image
        const transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${zoom})`;

        // Return: gradient base + blurred background + main contained image
        return `
        <div class="frame-background" style="background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2));"></div>
        <img src="${this.escapeHtml(localFile)}" alt="Background Blur" class="frame-bg-blur" />
        <img src="${this.escapeHtml(localFile)}" alt="Background" class="frame-bg-main" style="opacity: ${opacity}; transform: ${transform}; ${filter}" />`;
      }
    }

    return '<div class="frame-background" style="background: linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316);"></div>';
  }

  /**
   * Get filter CSS (simplified - just return empty string for now, can be enhanced)
   */
  private static getFilterCSS(filterName: string): string {
    // Common filters mapping
    const filters: { [key: string]: string } = {
      none: '',
      grayscale: 'filter: grayscale(100%);',
      sepia: 'filter: sepia(100%);',
      vintage: 'filter: sepia(50%) contrast(1.2) brightness(0.9);',
    };
    return filters[filterName] || '';
  }

  /**
   * Generate element HTML
   */
  private static generateElementHTML(
    element: any,
    imageMap: Map<string, string>,
    isDynamicStory: boolean = false
  ): string {
    const style = this.getElementStyle(element, imageMap, isDynamicStory);

    if (element.type === 'text') {
      const content = element.content || '';
      return `<div class="element element-text" style="${style}">${this.escapeHtml(content)}</div>`;
    }

    if (element.type === 'image' && element.mediaUrl) {
      const localFile = imageMap.get(element.mediaUrl);
      if (localFile) {
        return `<img class="element element-image" src="${this.escapeHtml(localFile)}" style="${style}" alt="">`;
      }
    }

    if (element.type === 'shape') {
      return `<div class="element element-shape" style="${style}"></div>`;
    }

    return '';
  }

  /**
   * Get element style
   */
  private static getElementStyle(
    element: any,
    _imageMap: Map<string, string>,
    isDynamicStory: boolean = false
  ): string {
    const styles: string[] = [];

    // For text elements in dynamic stories, position at bottom center (like CTA button)
    // For static stories, use exact user-defined positions
    if (element.type === 'text' && isDynamicStory) {
      styles.push(`position: absolute;`);
      styles.push(`bottom: 20px;`);
      styles.push(`left: 50%;`);
      styles.push(`transform: translateX(-50%);`);
      styles.push(`width: auto;`);
      styles.push(`max-width: 90%;`);
      styles.push(`min-width: ${element.width}px;`);
      styles.push(`height: auto;`);
      styles.push(`min-height: ${element.height}px;`);
    } else {
      // For static stories or non-text elements, use original positioning
      styles.push(`position: absolute;`);
      styles.push(`left: ${element.x}px;`);
      styles.push(`top: ${element.y}px;`);
      styles.push(`width: ${element.width}px;`);
      styles.push(`height: ${element.height}px;`);
    }

    if (element.style) {
      if (element.style.fontSize) styles.push(`font-size: ${element.style.fontSize}px;`);
      if (element.style.fontFamily) {
        // Only allow Google fonts
        const fontFamily = element.style.fontFamily;
        if (fontFamily.includes('Inter') || fontFamily.includes('Google')) {
          styles.push(`font-family: 'Inter', sans-serif;`);
        } else {
          styles.push(`font-family: 'Inter', sans-serif;`);
        }
      }
      if (element.style.fontWeight) styles.push(`font-weight: ${element.style.fontWeight};`);
      if (element.style.color) styles.push(`color: ${element.style.color};`);
      if (element.style.backgroundColor)
        styles.push(`background-color: ${element.style.backgroundColor};`);
      if (element.style.opacity !== undefined) {
        const opacity = element.style.opacity / 100;
        styles.push(`opacity: ${opacity};`);
      }
      if (element.style.rotation) {
        if (element.type === 'text' && isDynamicStory) {
          // For dynamic story text, combine centering with rotation
          styles.push(`transform: translateX(-50%) rotate(${element.style.rotation}deg);`);
        } else {
          // For static story text or other elements, just apply rotation
          styles.push(`transform: rotate(${element.style.rotation}deg);`);
        }
      }
      if (element.style.textAlign) styles.push(`text-align: ${element.style.textAlign};`);
    }

    return styles.join(' ');
  }

  /**
   * Generate CSS
   */
  private static generateCSS(story: Story, _options: ExportOptions): string {
    const format = story.format || 'portrait';
    const deviceFrame = story.deviceFrame || 'mobile';

    // Match editor dimensions exactly
    let width: number;
    let height: number;

    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        // Portrait + Mobile: 288x550 (matches editor w-72 = 288px, h-[550px] = 550px)
        width = 288;
        height = 550;
      } else {
        // Portrait + Video Player: 320x600 (matches editor w-80 = 320px, h-[600px] = 600px)
        width = 320;
        height = 600;
      }
    } else {
      // Landscape
      if (deviceFrame === 'mobile') {
        // Landscape + Mobile: 400x225 (matches editor w-[400px] = 400px, h-[225px] = 225px)
        width = 400;
        height = 225;
      } else {
        // Landscape + Video Player: 480x270 (matches editor w-[480px] = 480px, h-[270px] = 270px)
        width = 480;
        height = 270;
      }
    }

    return `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.story-container {
  width: ${width}px;
  height: ${height}px;
  position: relative;
  overflow: hidden;
}

.frame {
  position: absolute;
  width: 100%;
  height: 100%;
  display: none;
}

.frame.active {
  display: block;
}

.frame-background {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -2;
}

.frame-bg-blur {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(28px) brightness(0.9) saturate(110%);
  z-index: -1;
}

.frame-bg-main {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center center;
  z-index: 0;
  pointer-events: none;
}

.frame-content {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.element {
  position: absolute;
}

.element-text {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  max-width: 90%;
  margin: 0 auto;
}

.element-image {
  object-fit: cover;
}

a {
  display: block;
  text-decoration: none;
  color: inherit;
  width: 100%;
  height: 100%;
}

.story-container {
  cursor: pointer;
}

/* Progress Bar */
.progress-bar-container {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 16px;
  z-index: 20;
  display: flex;
  gap: 4px;
}

.progress-bar-item {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: #fff;
  width: 0%;
  transition: width 0.3s;
}

.progress-bar-fill.active {
  width: 100%;
}

.progress-bar-fill.current {
  width: 25%;
}

/* Publisher Header */
.publisher-header {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 32px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
}

.publisher-pic {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  border: 2px solid #fff;
  object-fit: cover;
  flex-shrink: 0;
}

.publisher-pic-placeholder {
  height: 32px;
  width: 32px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.publisher-info {
  flex: 1;
  min-width: 0;
}

.publisher-name {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.2;
}

.story-title {
  color: #fff;
  opacity: 0.8;
  font-size: 12px;
  line-height: 1.2;
  margin-top: 2px;
}

.frame-counter {
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
}

.frame {
  cursor: pointer;
}
`;
  }

  /**
   * Generate JavaScript (with click navigation)
   */
  private static generateJS(_story: Story, frames: StoryFrame[], _options: ExportOptions): string {
    return `
(function() {
  let currentFrame = 0;
  const frames = document.querySelectorAll('.frame');
  const totalFrames = ${frames.length};
  let autoAdvanceTimer = null;

  function showFrame(index) {
    if (index < 0 || index >= totalFrames) return;
    currentFrame = index;
    frames.forEach((frame, i) => {
      frame.classList.toggle('active', i === index);
    });
    
    // Update progress bars
    const progressBars = document.querySelectorAll('.progress-bar-fill');
    progressBars.forEach((bar, i) => {
      bar.classList.remove('active', 'current');
      if (i < index) {
        bar.classList.add('active');
      } else if (i === index) {
        bar.classList.add('current');
      }
    });
    
    // Update frame counter
    const currentFrameEl = document.querySelector('.current-frame');
    if (currentFrameEl) {
      currentFrameEl.textContent = (index + 1).toString();
    }
    
    // Restart auto-advance timer
    startAutoAdvance();
  }

  function nextFrame() {
    const next = (currentFrame + 1) % totalFrames;
    showFrame(next);
  }

  function prevFrame() {
    const prev = currentFrame === 0 ? totalFrames - 1 : currentFrame - 1;
    showFrame(prev);
  }

  function startAutoAdvance() {
    // Clear existing timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
    }
    
    // Only auto-advance if not on last frame
    if (currentFrame < totalFrames - 1) {
      const currentFrameEl = frames[currentFrame];
      const duration = parseInt(currentFrameEl.dataset.duration || '2500');
      autoAdvanceTimer = setTimeout(() => {
        nextFrame();
      }, duration);
    }
  }

  function handleClick(event) {
    // Determine click position (left half = previous, right half = next)
    const container = document.querySelector('.story-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const containerWidth = rect.width;
    
    if (clickX < containerWidth / 2) {
      // Left half - go to previous frame
      prevFrame();
    } else {
      // Right half - go to next frame
      nextFrame();
    }
  }

  function startStory() {
    showFrame(0);
    
    // Add click handler for navigation
    const container = document.querySelector('.story-container');
    if (container) {
      container.addEventListener('click', handleClick);
    }
    
    // Initialize progress bar for first frame
    const progressBars = document.querySelectorAll('.progress-bar-fill');
    if (progressBars.length > 0) {
      progressBars[0].classList.add('current');
    }
  }

  // Start story on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startStory);
  } else {
    startStory();
  }
})();
`;
  }

  /**
   * Minify HTML
   */
  private static async minifyHTML(html: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const result = await minifyHTML(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: false, // Disable JS minification to prevent breaking the code
        removeAttributeQuotes: false, // Keep quotes for proper parsing
        removeEmptyAttributes: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    } catch (error) {
      console.warn('HTML minification failed, using original:', error);
      return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    }
  }

  /**
   * Minify CSS (used internally by minifyHTML, but kept for potential future use)
   */
  // @ts-expect-error - Function is kept for potential future use
  private static async minifyCSS(css: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const result = minifyCSSLib(css);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return result.css as string;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('CSS minification failed, using original:', error);
      return css.replace(/\s+/g, ' ').replace(/;\s*}/g, '}').trim();
    }
  }

  /**
   * Minify JavaScript (used internally by minifyHTML, but kept for potential future use)
   */
  // @ts-expect-error - Function is kept for potential future use
  private static async minifyJS(js: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const result = await minifyJSLib(js);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return (result.code as string) || js;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('JS minification failed, using original:', error);
      return js.replace(/\s+/g, ' ').trim();
    }
  }

  /**
   * Create ZIP file
   */
  private static async createZip(
    sourceDir: string,
    zipPath: string,
    files: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add files to archive
      files.forEach((file) => {
        const filePath = path.join(sourceDir, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`[Export] Adding file to ZIP: ${file} (${stats.size} bytes)`);
          archive.file(filePath, { name: file });
        } else {
          console.warn(`[Export] File not found, skipping: ${filePath}`);
        }
      });

      archive.finalize();
    });
  }

  /**
   * Escape HTML
   */
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m] || m);
  }

  /**
   * Cleanup temporary directory
   */
  private static cleanup(dir: string): void {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to cleanup temp directory:', error);
    }
  }
}
