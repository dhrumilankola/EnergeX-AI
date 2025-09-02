import { Request, Response } from 'express';
import { RedisService } from '../services/redisService';
import { MySQLService } from '../services/mysqlService';
import { CacheResponse } from '../types/post';

export class CacheController {
  private redisService: RedisService;
  private mysqlService: MySQLService;

  constructor() {
    this.redisService = new RedisService();
    this.mysqlService = new MySQLService();
  }

  async getPosts(req: Request, res: Response): Promise<Response | void> {
    try {
      // get posts from Redis cache first
      let posts = await this.redisService.getPosts();
      let source: 'cache' | 'database' = 'cache';

      if (!posts) {
        // Cache miss - fetch from MySQL
        posts = await this.mysqlService.getPosts();
        source = 'database';

        // Store in cache for future requests
        if (posts && posts.length > 0) {
          await this.redisService.setPosts(posts);
        }
      }

      if (!posts || (Array.isArray(posts) && posts.length === 0)) {
        return res.status(404).json({ 
          message: 'No posts found',
          source: 'database'
        });
      }

      const response: CacheResponse<typeof posts> = {
        data: posts,
        source,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getPosts:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPost(req: Request, res: Response): Promise<Response | void> {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      let post = await this.redisService.getPost(postId);
      let source: 'cache' | 'database' = 'cache';

      if (!post) {
        post = await this.mysqlService.getPost(postId);
        source = 'database';

        if (post) {
          await this.redisService.setPost(post);
        }
      }

      if (!post) {
        return res.status(404).json({ 
          message: 'Post not found',
          source: 'database'
        });
      }

      const response: CacheResponse<typeof post> = {
        data: post,
        source,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getPost:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createPost(req: Request, res: Response): Promise<Response | void> {
    try {
      const { title, content, user_id } = req.body;

      if (!title || !content || !user_id) {
        return res.status(400).json({ 
          message: 'Title, content, and user_id are required' 
        });
      }

      // Create post in MySQL
      const post = await this.mysqlService.createPost(title, content, user_id);

      await this.redisService.invalidatePosts();

      // Store the new post in cache
      await this.redisService.setPost(post);

      res.status(201).json({
        message: 'Post created successfully',
        data: post,
        source: 'database'
      });
    } catch (error) {
      console.error('Error in createPost:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePost(req: Request, res: Response): Promise<Response | void> {
    try {
      const postId = parseInt(req.params.id);
      const { title, content } = req.body;

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }

      if (!title && !content) {
        return res.status(400).json({ 
          message: 'At least one field (title or content) is required' 
        });
      }

      // Update post in MySQL
      const post = await this.mysqlService.updatePost(postId, title || '', content || '');

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Invalidate and update cache
      await this.redisService.invalidatePost(postId);
      await this.redisService.setPost(post);

      res.json({
        message: 'Post updated successfully',
        data: post,
        source: 'database'
      });
    } catch (error) {
      console.error('Error in updatePost:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deletePost(req: Request, res: Response): Promise<Response | void> {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.body.user_id;

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'User ID is required for authorization' });
      }

      // First, get the post to check ownership
      const post = await this.mysqlService.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if user owns the post
      if (post.user_id !== userId) {
        return res.status(403).json({ message: 'You can only delete your own posts' });
      }

      // Delete post from MySQL
      const deleted = await this.mysqlService.deletePost(postId);

      if (!deleted) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Invalidate cache
      await this.redisService.invalidatePost(postId);
      await this.redisService.invalidatePosts();

      res.json({
        message: 'Post deleted successfully',
        postId,
        source: 'database'
      });
    } catch (error) {
      console.error('Error in deletePost:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const redisHealth = await this.redisService.getHealth();
      const mysqlHealth = await this.mysqlService.getHealth();

      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          redis: redisHealth ? 'healthy' : 'unhealthy',
          mysql: mysqlHealth ? 'healthy' : 'unhealthy'
        }
      };

      const overallHealth = redisHealth && mysqlHealth;
      res.status(overallHealth ? 200 : 503).json(status);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Health check failed'
      });
    }
  }
}
