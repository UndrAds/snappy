// User types
export type UserRole = 'admin' | 'publisher';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string[];
  };
}

// Story format and device types
export type StoryFormat = 'portrait' | 'landscape';
export type DeviceFrame = 'mobile' | 'video-player';
export type FloaterDirection = 'right' | 'left';
export type StoryType = 'static' | 'dynamic';

// Embed configuration types
export type EmbedType = 'regular' | 'floater';

export interface RegularEmbedOptions {
  autoplay?: boolean;
  loop?: boolean;
  width?: number; // default width in px when container doesn't specify
  height?: number; // default height in px when container doesn't specify
}

export interface FloaterEmbedOptions {
  enabled?: boolean; // when true, render as floater; when false, ignore floater
  direction?: FloaterDirection;
  triggerScroll?: number; // Percentage of page scroll to trigger floater
  position?: 'bottom' | 'top'; // Vertical position
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number; // milliseconds
  autoplay?: boolean;
  loop?: boolean;
}

export interface EmbedConfig {
  type?: EmbedType; // preferred render type; if 'floater' and floater.enabled, render floater
  regular?: RegularEmbedOptions;
  floater?: FloaterEmbedOptions;
}

// Ad Insertion Configuration types
export interface AdInsertionConfig {
  strategy: 'start-end' | 'alternate' | 'interval';
  interval?: number; // Number of posts between ads (for interval strategy)
  intervalPosition?: 'before' | 'after' | 'between'; // Position relative to posts (for interval strategy)
}

// RSS Configuration types
export interface RSSConfig {
  feedUrl: string;
  updateIntervalMinutes: number;
  maxPosts: number;
  allowRepetition: boolean;
  lastUpdated?: string;
  nextUpdate?: string;
  isActive: boolean;
  adInsertionConfig?: AdInsertionConfig; // Ad placement configuration for dynamic stories
}

// Story types
export interface Story {
  id: string;
  title: string;
  uniqueId: string;
  publisherName: string;
  publisherPic?: string;
  largeThumbnail?: string;
  smallThumbnail?: string;
  ctaType?: 'redirect' | 'form' | 'promo' | 'sell';
  ctaValue?: string;
  ctaText?: string;
  status: 'draft' | 'published' | 'archived';
  format: StoryFormat;
  deviceFrame: DeviceFrame;
  storyType: StoryType;
  defaultDurationMs?: number;
  rssConfig?: RSSConfig;
  embedConfig?: EmbedConfig;
  userId: string;
  createdAt: string;
  updatedAt: string;
  frames?: StoryFrame[];
}

export interface CreateStoryRequest {
  title: string;
  publisherName: string;
  publisherPic?: string;
  largeThumbnail?: string;
  smallThumbnail?: string;
  ctaType?: 'redirect' | 'form' | 'promo' | 'sell';
  ctaValue?: string;
  ctaText?: string;
  format?: StoryFormat;
  deviceFrame?: DeviceFrame;
  storyType?: StoryType;
  rssConfig?: RSSConfig;
  embedConfig?: EmbedConfig;
  uniqueId?: string; // Optional: allow providing a specific unique ID
  defaultDurationMs?: number;
}

export interface UpdateStoryRequest {
  title?: string;
  publisherName?: string;
  publisherPic?: string;
  largeThumbnail?: string;
  smallThumbnail?: string;
  ctaType?: 'redirect' | 'form' | 'promo' | 'sell';
  ctaValue?: string;
  ctaText?: string;
  status?: 'draft' | 'published' | 'archived';
  format?: StoryFormat;
  deviceFrame?: DeviceFrame;
  storyType?: StoryType;
  rssConfig?: RSSConfig;
  embedConfig?: EmbedConfig;
  uniqueId?: string; // Optional: allow updating the unique ID
  defaultDurationMs?: number;
  applyDefaultDurationToAll?: boolean; // If true, set all frames' durationMs to story default
}

export interface StoryFrame {
  id: string;
  order: number;
  type: 'story' | 'ad';
  hasContent: boolean;
  name?: string;
  link?: string; // Optional link URL for the frame
  linkText?: string; // Custom link text (defaults to "Link")
  durationMs?: number; // Per-frame duration in milliseconds
  storyId: string;
  createdAt: string;
  updatedAt: string;
  adConfig?: {
    adId: string;
    adUnitPath?: string;
    size?: [number, number];
  };
  elements?: StoryElement[];
  background?: StoryBackground;
}

export interface StoryElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  mediaUrl?: string;
  frameId: string;
  createdAt: string;
  updatedAt: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    opacity?: number; // Overall element opacity (for backward compatibility)
    textOpacity?: number; // Text color opacity
    backgroundOpacity?: number; // Background color opacity
    rotation?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    sharpness?: number;
    highlights?: number;
    filter?: string;
  };
}

export interface StoryBackground {
  id: string;
  type: 'color' | 'image' | 'video';
  value: string;
  opacity?: number;
  rotation?: number;
  zoom?: number;
  filter?: string;
  offsetX?: number;
  offsetY?: number;
  frameId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryFrameRequest {
  order: number;
  hasContent?: boolean;
  name?: string;
  link?: string;
  linkText?: string;
  durationMs?: number;
}

export interface UpdateStoryFrameRequest {
  order?: number;
  hasContent?: boolean;
  name?: string;
  link?: string;
  linkText?: string;
  durationMs?: number;
}

export interface CreateStoryElementRequest {
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  mediaUrl?: string;
  style?: any;
}

export interface UpdateStoryElementRequest {
  type?: 'text' | 'image' | 'shape';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  content?: string;
  mediaUrl?: string;
  style?: any;
}

export interface CreateStoryBackgroundRequest {
  type: 'color' | 'image' | 'video';
  value: string;
  opacity?: number;
  rotation?: number;
  zoom?: number;
  filter?: string;
  offsetX?: number;
  offsetY?: number;
}

export interface UpdateStoryBackgroundRequest {
  type?: 'color' | 'image' | 'video';
  value?: string;
  opacity?: number;
  rotation?: number;
  zoom?: number;
  filter?: string;
  offsetX?: number;
  offsetY?: number;
}

export interface FloaterEmbedRequest {
  storyId: string;
  direction: FloaterDirection;
  triggerScroll?: number; // Percentage of page scroll to trigger floater
  position?: 'bottom' | 'top'; // Vertical position
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number; // milliseconds
}

// Post types (keeping for backward compatibility)
export interface Post {
  id: string;
  title: string;
  content?: string;
  published: boolean;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title: string;
  content?: string;
  published?: boolean;
}

// Error types
export interface AppError {
  message: string;
  statusCode?: number;
  details?: string[];
}

// RSS Feed Processing types
export interface RSSFeedItem {
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  pubDate?: string;
  guid?: string;
}

export interface RSSProcessingStatus {
  storyId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  framesGenerated?: number;
  totalFrames?: number;
}

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  REDIS_URL?: string;
}

// Frontend specific types
export interface Theme {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Form types
export interface FormField {
  name: string;
  value: string;
  error?: string;
}

export interface FormState {
  [key: string]: FormField;
}
