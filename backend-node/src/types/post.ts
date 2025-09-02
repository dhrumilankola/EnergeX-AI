export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id?: number;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  user_id: number;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
}

export interface CacheResponse<T> {
  data: T;
  source: 'cache' | 'database';
  timestamp: string;
}
