import mysql from 'mysql2/promise';
import { Post } from '../types/post';

export class MySQLService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'energex',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async getPosts(): Promise<Post[]> {
    try {
      const [rows] = await this.pool.execute(`
        SELECT 
          p.id,
          p.title,
          p.content,
          p.created_at,
          p.updated_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `);

      return (rows as any[]).map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_id: row.user_id,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
        },
      }));
    } catch (error) {
      console.error('Error fetching posts from MySQL:', error);
      throw new Error('Failed to fetch posts from database');
    }
  }

  async getPost(id: number): Promise<Post | null> {
    try {
      const [rows] = await this.pool.execute(`
        SELECT 
          p.id,
          p.title,
          p.content,
          p.created_at,
          p.updated_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [id]);

      if ((rows as any[]).length === 0) {
        return null;
      }

      const row = (rows as any[])[0];
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_id: row.user_id,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
        },
      };
    } catch (error) {
      console.error(`Error fetching post ${id} from MySQL:`, error);
      throw new Error(`Failed to fetch post ${id} from database`);
    }
  }

  async createPost(title: string, content: string, userId: number): Promise<Post> {
    try {
      const [result] = await this.pool.execute(
        'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
        [title, content, userId]
      );

      const insertId = (result as any).insertId;
      return await this.getPost(insertId) as Post;
    } catch (error) {
      console.error('Error creating post in MySQL:', error);
      throw new Error('Failed to create post in database');
    }
  }

  async updatePost(id: number, title: string, content: string): Promise<Post | null> {
    try {
      await this.pool.execute(
        'UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
        [title, content, id]
      );

      return await this.getPost(id);
    } catch (error) {
      console.error(`Error updating post ${id} in MySQL:`, error);
      throw new Error(`Failed to update post ${id} in database`);
    }
  }

  async deletePost(id: number): Promise<boolean> {
    try {
      const [result] = await this.pool.execute(
        'DELETE FROM posts WHERE id = ?',
        [id]
      );

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting post ${id} in MySQL:`, error);
      throw new Error(`Failed to delete post ${id} from database`);
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      await this.pool.execute('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
