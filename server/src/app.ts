import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { config } from './config/env';

export const createApp = (): express.Application => {
  const app = express();

  // Security & parsing middleware
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount API endpoints
  app.use('/api', routes);

  // Catch-all 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Resource not found: ${req.method} ${req.originalUrl}`,
        code: 'NOT_FOUND',
      },
    });
  });

  // Global structured error handling middleware
  app.use(errorHandler);

  return app;
};
