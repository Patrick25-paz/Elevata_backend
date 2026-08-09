import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'express-async-errors'; // Auto-catch async errors

import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';

const app = express();

// 1. Core Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true, // Echo request origin (allows dev & production client easily)
    credentials: true
  })
);

// 2. Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 3. Body & Cookie Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    errors: []
  },
  standardHeaders: 'draft-6',
  legacyHeaders: false
});
app.use('/api', limiter);

// 5. App Routes
app.use('/api', apiRouter);

// 6. Handle Undefined Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// 7. Centralized Error Handler (must be last)
app.use(errorHandler);

export default app;
