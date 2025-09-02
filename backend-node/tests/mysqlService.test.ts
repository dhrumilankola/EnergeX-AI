/// <reference types="jest" />
import { MySQLService } from '../src/services/mysqlService';
import { Post } from '../src/types/post';

// Mock the mysql2 module
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    execute: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('MySQLService', () => {
  let mysqlService: MySQLService;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked pool
    const { createPool } = require('mysql2/promise');
    mockPool = createPool();
    
    mysqlService = new MySQLService();
    
    // Replace the private pool with our mock
    (mysqlService as any).pool = mockPool;
  });

  describe('getPosts', () => {
    it('should return posts from database', async () => {
      const mockRows = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user_id: 1,
          user_name: 'Test User',
          user_email: 'test@example.com'
        }
      ];

      mockPool.execute.mockResolvedValue([mockRows]);

      const result = await mysqlService.getPosts();

      expect(mockPool.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user_id: 1,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      await expect(mysqlService.getPosts()).rejects.toThrow('Failed to fetch posts from database');
    });
  });

  describe('getPost', () => {
    it('should return post from database', async () => {
      const mockRows = [
        {
          id: 1,
          title: 'Test Post',
          content: 'Test Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user_id: 1,
          user_name: 'Test User',
          user_email: 'test@example.com'
        }
      ];

      mockPool.execute.mockResolvedValue([mockRows]);

      const result = await mysqlService.getPost(1);

      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(result).toEqual({
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user_id: 1,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('should return null when post not found', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      const result = await mysqlService.getPost(999);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      await expect(mysqlService.getPost(1)).rejects.toThrow('Failed to fetch post 1 from database');
    });
  });

  describe('createPost', () => {
    it('should create post and return it', async () => {
      const mockInsertResult = { insertId: 1 };
      const mockPostRow = [
        {
          id: 1,
          title: 'New Post',
          content: 'New Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user_id: 1,
          user_name: 'Test User',
          user_email: 'test@example.com'
        }
      ];

      // Mock the insert operation
      mockPool.execute
        .mockResolvedValueOnce([mockInsertResult]) // First call for INSERT
        .mockResolvedValueOnce([mockPostRow]);     // Second call for getPost

      const result = await mysqlService.createPost('New Post', 'New Content', 1);

      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
        ['New Post', 'New Content', 1]
      );
      expect(result).toEqual({
        id: 1,
        title: 'New Post',
        content: 'New Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user_id: 1,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      await expect(mysqlService.createPost('Title', 'Content', 1))
        .rejects.toThrow('Failed to create post in database');
    });
  });

  describe('updatePost', () => {
    it('should update post and return it', async () => {
      const mockPostRow = [
        {
          id: 1,
          title: 'Updated Post',
          content: 'Updated Content',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user_id: 1,
          user_name: 'Test User',
          user_email: 'test@example.com'
        }
      ];

      // Mock the update and get operations
      mockPool.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // First call for UPDATE
        .mockResolvedValueOnce([mockPostRow]);        // Second call for getPost

      const result = await mysqlService.updatePost(1, 'Updated Post', 'Updated Content');

      expect(mockPool.execute).toHaveBeenCalledWith(
        'UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
        ['Updated Post', 'Updated Content', 1]
      );
      expect(result).toEqual({
        id: 1,
        title: 'Updated Post',
        content: 'Updated Content',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user_id: 1,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      await expect(mysqlService.updatePost(1, 'Title', 'Content'))
        .rejects.toThrow('Failed to update post 1 in database');
    });
  });

  describe('deletePost', () => {
    it('should delete post and return true', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await mysqlService.deletePost(1);

      expect(mockPool.execute).toHaveBeenCalledWith(
        'DELETE FROM posts WHERE id = ?',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when post not found', async () => {
      mockPool.execute.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await mysqlService.deletePost(999);

      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database error'));

      await expect(mysqlService.deletePost(1))
        .rejects.toThrow('Failed to delete post 1 from database');
    });
  });

  describe('getHealth', () => {
    it('should return true when database is healthy', async () => {
      mockPool.execute.mockResolvedValue([[]]);

      const result = await mysqlService.getHealth();

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT 1');
      expect(result).toBe(true);
    });

    it('should return false when database is unhealthy', async () => {
      mockPool.execute.mockRejectedValue(new Error('Connection failed'));

      const result = await mysqlService.getHealth();

      expect(result).toBe(false);
    });
  });

  describe('close', () => {
    it('should close the database connection pool', async () => {
      mockPool.end.mockResolvedValue(undefined);

      await mysqlService.close();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
