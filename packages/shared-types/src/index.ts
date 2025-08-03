// User types
export interface User {
  id: string;
  email: string;
  name?: string;
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
  status: 'draft' | 'published' | 'archived';
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
}

export interface UpdateStoryRequest {
  title?: string;
  publisherName?: string;
  publisherPic?: string;
  largeThumbnail?: string;
  smallThumbnail?: string;
  ctaType?: 'redirect' | 'form' | 'promo' | 'sell';
  ctaValue?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface StoryFrame {
  id: string;
  order: number;
  hasContent: boolean;
  storyId: string;
  createdAt: string;
  updatedAt: string;
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
    opacity?: number;
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
}

export interface UpdateStoryFrameRequest {
  order?: number;
  hasContent?: boolean;
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

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
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
