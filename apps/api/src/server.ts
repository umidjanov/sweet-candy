import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { AuthService } from './services/auth.service';
import { TelegramBotRunner } from './integrations/telegram/telegram-bot.runner';

async function startServer() {
  try {
    console.log('🧁 Initializing Sweet CANDY Backend API Service...');

    // Attempt admin bootstrap if database connection is available
    AuthService.bootstrapAdmin().catch((err) => {
      console.warn('⚠️ Admin bootstrap deferred (database may still be starting):', err.message);
    });

    // Start Telegram Bot Runner
    TelegramBotRunner.start().catch((err) => {
      console.warn('⚠️ Telegram Bot startup notice:', err.message);
    });

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Sweet CANDY API Server running on port ${env.PORT}`);
      console.log(`🔗 API Base: ${env.API_URL}/api/v1`);
      console.log(`🩺 Health check: ${env.API_URL}/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Gracefully shutting down...`);
      TelegramBotRunner.stop();
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

startServer();

