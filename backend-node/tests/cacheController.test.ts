/// <reference types="jest" />
import request from 'supertest';
import express from 'express';
import { CacheController } from '../src/controllers/cacheController';
import { RedisService } from '../src/services/redisService';
import { MySQLService } from '../src/services/mysqlService';

// Mock the services
jest.mock('../src/services/redisService');
jest.mock('../src/services/mysqlService');

const MockedRedisService = RedisService as jest.MockedClass<typeof RedisService>;
const MockedMySQLService = MySQLService as jest.MockedClass<typeof MySQLService>;

describe('CacheController', () => {
  let app: express.Application;
  let cacheController: CacheController;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create fresh instance
    cacheController = new CacheController();

    // Prepare to inject fakes into controller
    app.get('/posts', (req, res) => cacheController.getPosts(req, res));
    app.get('/posts/:id', (req, res) => cacheController.getPost(req, res));
    app.post('/posts', (req, res) => cacheController.createPost(req, res));
    app.put('/posts/:id', (req, res) => cacheController.updatePost(req, res));
    app.delete('/posts/:id', (req, res) => cacheController.deletePost(req, res));
    app.get('/health', (req, res) => cacheController.healthCheck(req, res));
  });

  describe('GET /posts', () => {
    it('should return posts from cache when available', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      ];

      // Inject Redis fake directly into controller
      const mockRedisInstance = {
        getPosts: jest.fn().mockResolvedValue(mockPosts),
        setPosts: jest.fn(),
        invalidatePosts: jest.fn(),
        invalidatePost: jest.fn(),
        setPost: jest.fn(),
        getPost: jest.fn(),
        getHealth: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      (cacheController as any).redisService = mockRedisInstance;

      const response = await request(app)
        .get('/posts')
        .expect(200);

      expect(response.body.source).toBe('cache');
      expect(response.body.data).toEqual(mockPosts);
      expect(mockRedisInstance.getPosts).toHaveBeenCalled();
    });

    it('should fetch from database and cache when Redis miss', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: { id: 1, name: 'Test User', email: 'test@example.com' }
        }
      ];

      // Inject fakes
      const mockRedisInstance = {
        getPosts: jest.fn().mockResolvedValue(null),
        setPosts: jest.fn().mockResolvedValue(undefined),
        invalidatePosts: jest.fn(),
        invalidatePost: jest.fn(),
        setPost: jest.fn(),
        getPost: jest.fn(),
        getHealth: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      const mockMySQLInstance = {
        getPosts: jest.fn().mockResolvedValue(mockPosts),
        getPost: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
        getHealth: jest.fn(),
        close: jest.fn(),
      };
      (cacheController as any).redisService = mockRedisInstance;
      (cacheController as any).mysqlService = mockMySQLInstance;

      const response = await request(app)
        .get('/posts')
        .expect(200);

      expect(response.body.source).toBe('database');
      expect(response.body.data).toEqual(mockPosts);
      expect(mockRedisInstance.getPosts).toHaveBeenCalled();
      expect(mockMySQLInstance.getPosts).toHaveBeenCalled();
      expect(mockRedisInstance.setPosts).toHaveBeenCalledWith(mockPosts);
    });

    it('should return 404 when no posts found', async () => {
      const mockRedisInstance = {
        getPosts: jest.fn().mockResolvedValue(null),
        setPosts: jest.fn(),
        invalidatePosts: jest.fn(),
        invalidatePost: jest.fn(),
        setPost: jest.fn(),
        getPost: jest.fn(),
        getHealth: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };

      const mockMySQLInstance = {
        getPosts: jest.fn().mockResolvedValue([]),
        getPost: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
        getHealth: jest.fn(),
        close: jest.fn(),
      };
      (cacheController as any).redisService = mockRedisInstance;
      (cacheController as any).mysqlService = mockMySQLInstance;

      const response = await request(app)
        .get('/posts')
        .expect(404);

      expect(response.body.message).toBe('No posts found');
    });
  });

  describe('GET /posts/:id', () => {
    it('should return post from cache when available', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      const mockRedisInstance = {
        getPost: jest.fn().mockResolvedValue(mockPost),
        getPosts: jest.fn(),
        setPosts: jest.fn(),
        invalidatePosts: jest.fn(),
        invalidatePost: jest.fn(),
        setPost: jest.fn(),
        getHealth: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      (cacheController as any).redisService = mockRedisInstance;

      const response = await request(app)
        .get('/posts/1')
        .expect(200);

      expect(response.body.source).toBe('cache');
      expect(response.body.data).toEqual(mockPost);
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .get('/posts/invalid')
        .expect(400);

      expect(response.body.message).toBe('Invalid post ID');
    });
  });

  describe('POST /posts', () => {
    it('should create post and invalidate cache', async () => {
      const mockPost = {
        id: 1,
        title: 'New Post',
        content: 'New Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      const mockMySQLInstance = {
        createPost: jest.fn().mockResolvedValue(mockPost),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
        getHealth: jest.fn(),
        close: jest.fn(),
      };

      const mockRedisInstance = {
        invalidatePosts: jest.fn().mockResolvedValue(undefined),
        setPost: jest.fn().mockResolvedValue(undefined),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        setPosts: jest.fn(),
        invalidatePost: jest.fn(),
        getHealth: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      (cacheController as any).mysqlService = mockMySQLInstance;
      (cacheController as any).redisService = mockRedisInstance;

      const response = await request(app)
        .post('/posts')
        .send({
          title: 'New Post',
          content: 'New Content',
          user_id: 1
        })
        .expect(201);

      expect(response.body.message).toBe('Post created successfully');
      expect(response.body.data).toEqual(mockPost);
      expect(mockMySQLInstance.createPost).toHaveBeenCalledWith('New Post', 'New Content', 1);
      expect(mockRedisInstance.invalidatePosts).toHaveBeenCalled();
      expect(mockRedisInstance.setPost).toHaveBeenCalledWith(mockPost);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/posts')
        .send({
          title: 'New Post'
          // Missing content and user_id
        })
        .expect(400);

      expect(response.body.message).toBe('Title, content, and user_id are required');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status when all services are up', async () => {
      const mockRedisInstance = {
        getHealth: jest.fn().mockResolvedValue(true),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        setPosts: jest.fn(),
        invalidatePosts: jest.fn(),
        invalidatePost: jest.fn(),
        setPost: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      const mockMySQLInstance = {
        getHealth: jest.fn().mockResolvedValue(true),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
        close: jest.fn(),
      };
      (cacheController as any).redisService = mockRedisInstance;
      (cacheController as any).mysqlService = mockMySQLInstance;

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services.redis).toBe('healthy');
      expect(response.body.services.mysql).toBe('healthy');
    });

    it('should return unhealthy status when services are down', async () => {
      const mockRedisInstance = {
        getHealth: jest.fn().mockResolvedValue(false),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        setPosts: jest.fn(),
        invalidatePosts: jest.fn(),
        invalidatePost: jest.fn(),
        setPost: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      const mockMySQLInstance = {
        getHealth: jest.fn().mockResolvedValue(true),
        getPosts: jest.fn(),
        getPost: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
        close: jest.fn(),
      };
      (cacheController as any).redisService = mockRedisInstance;
      (cacheController as any).mysqlService = mockMySQLInstance;

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('ok');
      expect(response.body.services.redis).toBe('unhealthy');
      expect(response.body.services.mysql).toBe('healthy');
    });
  });
});
