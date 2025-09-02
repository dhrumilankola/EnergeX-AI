import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import cacheRoutes from './routes/cacheRoutes';

export const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/cache', cacheRoutes);

// Internal API for WebSocket broadcasting
const internalApiSecret = process.env.REALTIME_API_SECRET;

const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const providedSecret = req.headers['x-internal-secret'];
  if (!providedSecret || providedSecret !== internalApiSecret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

app.post('/internal/broadcast', internalAuthMiddleware, (req: Request, res: Response) => {
  const { event, data } = req.body;
  if (!event || !data) {
    return res.status(400).json({ message: 'Event and data are required' });
  }
  io.emit(event, data);
  res.status(200).json({ message: 'Broadcast successful' });
});

// WebSocket connection handling
io.on('connection', (socket: Socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Cache service is running on port ${PORT}`);
    console.log(`Cache API available at http://localhost:${PORT}/cache`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  });
}

export default app;