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

// Post types
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
