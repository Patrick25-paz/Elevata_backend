import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'express-async-errors'; // Auto-catch async errors

import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';

const app = express();

// 1. Core Security Middlewares
app.use(helmet());
const rawOrigin = process.env.ALLOWED_ORIGIN || process.env.CORS_ORIGIN || '';
const origins = [
  ...rawOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
  'https://elevata.voltaleltd.com',
  'https://elevata.kigalibespoke.com',
  'https://elevata-pink.vercel.app',
  'http://localhost:5173'
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new AppError('This website is not allowed to access the Elevata API.', 403));
    },
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

// 4. App Routes
app.use('/api', apiRouter);

// 5. Handle Undefined Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// 6. Centralized Error Handler (must be last)
app.use(errorHandler);

export default app;
