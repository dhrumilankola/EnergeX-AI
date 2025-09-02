import { Router } from 'express';
import { CacheController } from '../controllers/cacheController';

export function createCacheRouter(controller?: CacheController): Router {
  const router = Router();
  const cacheController = controller ?? new CacheController();

  router.get('/posts', (req, res) => cacheController.getPosts(req, res));
  router.get('/posts/:id', (req, res) => cacheController.getPost(req, res));
  router.post('/posts', (req, res) => cacheController.createPost(req, res));
  router.put('/posts/:id', (req, res) => cacheController.updatePost(req, res));
  router.delete('/posts/:id', (req, res) => cacheController.deletePost(req, res));
  router.get('/health', (req, res) => cacheController.healthCheck(req, res));

  return router;
}

export default createCacheRouter();
