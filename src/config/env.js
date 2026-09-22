import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL' }),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters' }),
  JWT_REFRESH_SECRET: z.string().min(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' }),
  ACCESS_TOKEN_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LIVEKIT_API_KEY: z.string().optional().default('API47QHw2BCbjJN'),
  LIVEKIT_API_SECRET: z.string().optional().default('ZYfIqMNcvY5VIWcxKUOwpSpXSNBaO0GPbRij1RUgNiG'),
  LIVEKIT_URL: z.string().optional().default('wss://elevata-z1pfmey8.livekit.cloud')
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
