import { createClient, RedisClientType } from 'redis';
import { Post } from '../types/post';

export class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async getPosts(): Promise<Post[] | null> {
    try {
      await this.connect();
      const cachedPosts = await this.client.get('posts:all');
      return cachedPosts ? JSON.parse(cachedPosts) : null;
    } catch (error) {
      console.error('Error getting posts from Redis:', error);
      return null;
    }
  }

  async getPost(id: number): Promise<Post | null> {
    try {
      await this.connect();
      const cachedPost = await this.client.get(`post:${id}`);
      return cachedPost ? JSON.parse(cachedPost) : null;
    } catch (error) {
      console.error(`Error getting post ${id} from Redis:`, error);
      return null;
    }
  }

  async setPosts(posts: Post[]): Promise<void> {
    try {
      await this.connect();
      // Cache posts for 5 minutes
      await this.client.setEx('posts:all', 300, JSON.stringify(posts));
    } catch (error) {
      console.error('Error setting posts in Redis:', error);
    }
  }

  async setPost(post: Post): Promise<void> {
    try {
      await this.connect();
      // Cache individual post for 10 minutes
      await this.client.setEx(`post:${post.id}`, 600, JSON.stringify(post));
    } catch (error) {
      console.error(`Error setting post ${post.id} in Redis:`, error);
    }
  }

  async invalidatePosts(): Promise<void> {
    try {
      await this.connect();
      await this.client.del('posts:all');
    } catch (error) {
      console.error('Error invalidating posts in Redis:', error);
    }
  }

  async invalidatePost(id: number): Promise<void> {
    try {
      await this.connect();
      await this.client.del(`post:${id}`);
    } catch (error) {
      console.error(`Error invalidating post ${id} in Redis:`, error);
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      await this.connect();
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}
