import { nodeApiService } from './nodeApi';

class HybridApiService {
  constructor() {
    this.useNodeApi = true;
    this.fallbackToGraphQL = true;
  }

  async getPosts() {
    if (this.useNodeApi) {
      try {
        const response = await nodeApiService.getPosts();
        console.log(`Posts fetched from ${response.source} via Node.js API`);
        return {
          posts: response.data,
          source: response.source,
          timestamp: response.timestamp,
        };
      } catch (error) {
        console.warn('Node.js API failed, falling back to GraphQL:', error.message);
        if (this.fallbackToGraphQL) {
          return this.fallbackToGraphQLPosts();
        }
        throw error;
      }
    }
    return this.fallbackToGraphQLPosts();
  }

  async getPost(id) {
    if (this.useNodeApi) {
      try {
        const response = await nodeApiService.getPost(id);
        console.log(`Post ${id} fetched from ${response.source} via Node.js API`);
        return {
          post: response.data,
          source: response.source,
          timestamp: response.timestamp,
        };
      } catch (error) {
        console.warn(`Node.js API failed for post ${id}, falling back to GraphQL:`, error.message);
        if (this.fallbackToGraphQL) {
          return this.fallbackToGraphQLPost(id);
        }
        throw error;
      }
    }
    return this.fallbackToGraphQLPost(id);
  }

  async createPost(title, content, userId) {
    if (this.useNodeApi) {
      try {
        const response = await nodeApiService.createPost(title, content, userId);
        console.log('Post created via Node.js API');
        return {
          createPost: response.data,
          source: 'database',
        };
      } catch (error) {
        console.warn('Node.js API failed for post creation, falling back to GraphQL:', error.message);
        if (this.fallbackToGraphQL) {
          return this.fallbackToGraphQLCreatePost(title, content);
        }
        throw error;
      }
    }
    return this.fallbackToGraphQLCreatePost(title, content);
  }

  async updatePost(id, title, content) {
    if (this.useNodeApi) {
      try {
        const response = await nodeApiService.updatePost(id, title, content);
        console.log(`Post ${id} updated via Node.js API`);
        return {
          updatePost: response.data,
          source: 'database',
        };
      } catch (error) {
        console.warn(`Node.js API failed for post update ${id}, falling back to GraphQL:`, error.message);
        if (this.fallbackToGraphQL) {
          return this.fallbackToGraphQLUpdatePost(id, title, content);
        }
        throw error;
      }
    }
    return this.fallbackToGraphQLUpdatePost(id, title, content);
  }

  async deletePost(id, userId) {
    if (this.useNodeApi) {
      try {
        const response = await nodeApiService.deletePost(id, userId);
        console.log(`Post ${id} deleted via Node.js API`);
        return {
          deletePost: response.data,
          source: 'database',
        };
      } catch (error) {
        console.warn(`Node.js API failed for post deletion ${id}, falling back to GraphQL:`, error.message);
        if (this.fallbackToGraphQL) {
          return this.fallbackToGraphQLDeletePost(id);
        }
        throw error;
      }
    }
    return this.fallbackToGraphQLDeletePost(id);
  }

  async healthCheck() {
    try {
      const response = await nodeApiService.healthCheck();
      return {
        nodeApi: response,
        graphql: { status: 'available' },
      };
    } catch (error) {
      return {
        nodeApi: { status: 'unhealthy', error: error.message },
        graphql: { status: 'available' },
      };
    }
  }

  setApiPreference(useNodeApi, fallbackToGraphQL = true) {
    this.useNodeApi = useNodeApi;
    this.fallbackToGraphQL = fallbackToGraphQL;
  }

  async fallbackToGraphQLPosts() {
    throw new Error('GraphQL fallback not implemented - use Apollo Client directly');
  }

  async fallbackToGraphQLPost(id) {
    throw new Error('GraphQL fallback not implemented - use Apollo Client directly');
  }

  async fallbackToGraphQLCreatePost(title, content) {
    throw new Error('GraphQL fallback not implemented - use Apollo Client directly');
  }

  async fallbackToGraphQLUpdatePost(id, title, content) {
    throw new Error('GraphQL fallback not implemented - use Apollo Client directly');
  }

  async fallbackToGraphQLDeletePost(id) {
    throw new Error('GraphQL fallback not implemented - use Apollo Client directly');
  }
}

export const hybridApi = new HybridApiService();
export default hybridApi;
