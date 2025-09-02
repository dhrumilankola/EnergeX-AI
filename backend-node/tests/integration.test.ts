/// <reference types="jest" />
// Mocks must be declared before importing modules that use them
jest.mock('../src/services/redisService');
jest.mock('../src/services/mysqlService');

import request from 'supertest';
import express from 'express';
import { createCacheRouter } from '../src/routes/cacheRoutes';
import { CacheController } from '../src/controllers/cacheController';

const { RedisService } = require('../src/services/redisService');
const { MySQLService } = require('../src/services/mysqlService');

describe('Cache API Integration Tests', () => {
  let app: express.Application;
  let controller: CacheController;
  let redisFake: any;
  let mysqlFake: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    controller = new CacheController();
    // default fakes; override per test
    redisFake = {
      getPosts: jest.fn().mockResolvedValue(null),
      setPosts: jest.fn().mockResolvedValue(undefined),
      getPost: jest.fn().mockResolvedValue(null),
      setPost: jest.fn().mockResolvedValue(undefined),
      invalidatePosts: jest.fn().mockResolvedValue(undefined),
      invalidatePost: jest.fn().mockResolvedValue(undefined),
      getHealth: jest.fn().mockResolvedValue(true),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    mysqlFake = {
      getPosts: jest.fn().mockResolvedValue([]),
      getPost: jest.fn().mockResolvedValue(null),
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      getHealth: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
    };
    (controller as any).redisService = redisFake;
    (controller as any).mysqlService = mysqlFake;
    app.use('/cache', createCacheRouter(controller));
    jest.clearAllMocks();
  });

  describe('GET /cache/posts', () => {
    it('should return cached posts with cache source', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Cached Post',
          content: 'Cached Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      ];

      redisFake.getPosts.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/cache/posts')
        .expect(200);

      expect(response.body.source).toBe('cache');
      expect(response.body.data).toEqual(mockPosts);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return database posts with database source when cache miss', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Database Post',
          content: 'Database Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      ];

      redisFake.getPosts.mockResolvedValue(null);
      redisFake.setPosts.mockResolvedValue(undefined);
      mysqlFake.getPosts.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/cache/posts')
        .expect(200);

      expect(response.body.source).toBe('database');
      expect(response.body.data).toEqual(mockPosts);
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /cache/posts/:id', () => {
    it('should return cached post with cache source', async () => {
      const mockPost = {
        id: 1,
        title: 'Cached Post',
        content: 'Cached Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      redisFake.getPost.mockResolvedValue(mockPost);

      const response = await request(app)
        .get('/cache/posts/1')
        .expect(200);

      expect(response.body.source).toBe('cache');
      expect(response.body.data).toEqual(mockPost);
    });

    it('should return database post with database source when cache miss', async () => {
      const mockPost = {
        id: 1,
        title: 'Database Post',
        content: 'Database Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      redisFake.getPost.mockResolvedValue(null);
      redisFake.setPost.mockResolvedValue(undefined);
      mysqlFake.getPost.mockResolvedValue(mockPost);

      const response = await request(app)
        .get('/cache/posts/1')
        .expect(200);

      expect(response.body.source).toBe('database');
      expect(response.body.data).toEqual(mockPost);
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .get('/cache/posts/invalid')
        .expect(400);

      expect(response.body.message).toBe('Invalid post ID');
    });

    it('should return 404 when post not found', async () => {
      redisFake.getPost.mockResolvedValue(null);
      mysqlFake.getPost.mockResolvedValue(null);

      const response = await request(app)
        .get('/cache/posts/999')
        .expect(404);

      expect(response.body.message).toBe('Post not found');
    });
  });

  describe('POST /cache/posts', () => {
    it('should create post and invalidate cache', async () => {
      const mockPost = {
        id: 1,
        title: 'New Post',
        content: 'New Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      mysqlFake.createPost.mockResolvedValue(mockPost);
      redisFake.invalidatePosts.mockResolvedValue(undefined);
      redisFake.setPost.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/cache/posts')
        .send({
          title: 'New Post',
          content: 'New Content',
          user_id: 1
        })
        .expect(201);

      expect(response.body.message).toBe('Post created successfully');
      expect(response.body.data).toEqual(mockPost);
      expect(response.body.source).toBe('database');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/cache/posts')
        .send({
          title: 'New Post'
          // Missing content and user_id
        })
        .expect(400);

      expect(response.body.message).toBe('Title, content, and user_id are required');
    });
  });

  describe('PUT /cache/posts/:id', () => {
    it('should update post and invalidate cache', async () => {
      const mockPost = {
        id: 1,
        title: 'Updated Post',
        content: 'Updated Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      mysqlFake.updatePost.mockResolvedValue(mockPost);
      redisFake.invalidatePost.mockResolvedValue(undefined);
      redisFake.setPost.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/cache/posts/1')
        .send({
          title: 'Updated Post',
          content: 'Updated Content'
        })
        .expect(200);

      expect(response.body.message).toBe('Post updated successfully');
      expect(response.body.data).toEqual(mockPost);
      expect(response.body.source).toBe('database');
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .put('/cache/posts/invalid')
        .send({
          title: 'Updated Post'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid post ID');
    });

    it('should return 400 when no update fields provided', async () => {
      const response = await request(app)
        .put('/cache/posts/1')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('At least one field (title or content) is required');
    });
  });

  describe('DELETE /cache/posts/:id', () => {
    it('should delete post and invalidate cache', async () => {
      mysqlFake.getPost.mockResolvedValue({ id: 1, title: 't', content: 'c', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', user_id: 1, user: { id: 1, name: 'U', email: 'e' } });
      mysqlFake.deletePost.mockResolvedValue(true);
      redisFake.invalidatePost.mockResolvedValue(undefined);
      redisFake.invalidatePosts.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/cache/posts/1')
        .send({ user_id: 1 })
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');
      expect(response.body.postId).toBe(1);
      expect(response.body.source).toBe('database');
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .delete('/cache/posts/invalid')
        .expect(400);

      expect(response.body.message).toBe('Invalid post ID');
    });

    it('should return 404 when post not found', async () => {
      MySQLService.prototype.deletePost = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .delete('/cache/posts/999')
        .send({ user_id: 1 })
        .expect(404);

      expect(response.body.message).toBe('Post not found');
    });
  });

  describe('GET /cache/health', () => {
    it('should return healthy status when all services are up', async () => {
      redisFake.getHealth.mockResolvedValue(true);
      mysqlFake.getHealth.mockResolvedValue(true);

      const response = await request(app)
        .get('/cache/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services.redis).toBe('healthy');
      expect(response.body.services.mysql).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return unhealthy status when services are down', async () => {
      redisFake.getHealth.mockResolvedValue(false);
      mysqlFake.getHealth.mockResolvedValue(true);

      const response = await request(app)
        .get('/cache/health')
        .expect(503);

      expect(response.body.status).toBe('ok');
      expect(response.body.services.redis).toBe('unhealthy');
      expect(response.body.services.mysql).toBe('healthy');
    });
  });
});
