/// <reference types="jest" />
import { RedisService } from '../src/services/redisService';
import { Post } from '../src/types/post';

// Mock the Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(),
  })),
}));

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked Redis client
    const { createClient } = require('redis');
    mockRedisClient = createClient();
    
    redisService = new RedisService();
    
    // Replace the private client with our mock
    (redisService as any).client = mockRedisClient;
    (redisService as any).isConnected = true;
  });

  describe('connect', () => {
    it('should connect to Redis when not connected', async () => {
      (redisService as any).isConnected = false;
      mockRedisClient.connect.mockResolvedValue(undefined);

      await redisService.connect();

      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect((redisService as any).isConnected).toBe(true);
    });

    it('should not connect when already connected', async () => {
      (redisService as any).isConnected = true;

      await redisService.connect();

      expect(mockRedisClient.connect).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis when connected', async () => {
      (redisService as any).isConnected = true;
      mockRedisClient.disconnect.mockResolvedValue(undefined);

      await redisService.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
      expect((redisService as any).isConnected).toBe(false);
    });

    it('should not disconnect when not connected', async () => {
      (redisService as any).isConnected = false;

      await redisService.disconnect();

      expect(mockRedisClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('getPosts', () => {
    it('should return posts from Redis', async () => {
      const mockPosts: Post[] = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      ];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockPosts));

      const result = await redisService.getPosts();

      expect(mockRedisClient.get).toHaveBeenCalledWith('posts:all');
      expect(result).toEqual(mockPosts);
    });

    it('should return null when no posts in Redis', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisService.getPosts();

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await redisService.getPosts();

      expect(result).toBeNull();
    });
  });

  describe('getPost', () => {
    it('should return post from Redis', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockPost));

      const result = await redisService.getPost(1);

      expect(mockRedisClient.get).toHaveBeenCalledWith('post:1');
      expect(result).toEqual(mockPost);
    });

    it('should return null when post not in Redis', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisService.getPost(1);

      expect(result).toBeNull();
    });
  });

  describe('setPosts', () => {
    it('should store posts in Redis with TTL', async () => {
      const mockPosts: Post[] = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      ];

      mockRedisClient.setEx.mockResolvedValue(undefined);

      await redisService.setPosts(mockPosts);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'posts:all',
        300, // 5 minutes TTL
        JSON.stringify(mockPosts)
      );
    });
  });

  describe('setPost', () => {
    it('should store post in Redis with TTL', async () => {
      const mockPost: Post = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      mockRedisClient.setEx.mockResolvedValue(undefined);

      await redisService.setPost(mockPost);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'post:1',
        600, // 10 minutes TTL
        JSON.stringify(mockPost)
      );
    });
  });

  describe('invalidatePosts', () => {
    it('should delete posts cache from Redis', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await redisService.invalidatePosts();

      expect(mockRedisClient.del).toHaveBeenCalledWith('posts:all');
    });
  });

  describe('invalidatePost', () => {
    it('should delete specific post cache from Redis', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await redisService.invalidatePost(1);

      expect(mockRedisClient.del).toHaveBeenCalledWith('post:1');
    });
  });

  describe('getHealth', () => {
    it('should return true when Redis is healthy', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await redisService.getHealth();

      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when Redis is unhealthy', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await redisService.getHealth();

      expect(result).toBe(false);
    });
  });
});
