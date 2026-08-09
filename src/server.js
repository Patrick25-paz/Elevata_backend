import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';

const PORT = env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection established successfully.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Elevata Backend Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      console.log(`👉 API Docs: http://localhost:${PORT}/api`);
    });

    // Graceful Shutdown Handler
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Closing connections...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        await prisma.$disconnect();
        console.log('🔌 Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to bootstrap Elevata Backend:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
