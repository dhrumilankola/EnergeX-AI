import axios from 'axios';

const NODE_API_BASE_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:4000';

const nodeApi = axios.create({
  baseURL: NODE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const nodeApiService = {
  async getPosts() {
    try {
      const response = await nodeApi.get('/cache/posts');
      return response.data;
    } catch (error) {
      console.error('Error fetching posts from Node.js API:', error);
      throw error;
    }
  },

  async getPost(id) {
    try {
      const response = await nodeApi.get(`/cache/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching post ${id} from Node.js API:`, error);
      throw error;
    }
  },

  async createPost(title, content, userId) {
    try {
      const response = await nodeApi.post('/cache/posts', {
        title,
        content,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating post via Node.js API:', error);
      throw error;
    }
  },

  async updatePost(id, title, content) {
    try {
      const response = await nodeApi.put(`/cache/posts/${id}`, {
        title,
        content,
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating post ${id} via Node.js API:`, error);
      throw error;
    }
  },

  async deletePost(id, userId) {
    try {
      const response = await nodeApi.delete(`/cache/posts/${id}`, {
        data: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting post ${id} via Node.js API:`, error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await nodeApi.get('/cache/health');
      return response.data;
    } catch (error) {
      console.error('Error checking Node.js API health:', error);
      throw error;
    }
  },
};

export default nodeApi;
