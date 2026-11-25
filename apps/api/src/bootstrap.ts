import { prisma } from './config/database';
import { AuthService } from './services/auth.service';
import { seedCategoriesAndSettings } from './utils/seed-defaults';
import { TelegramBotRunner } from './integrations/telegram/telegram-bot.runner';
import { getPublicApiOrigin, isDatabaseConfigured, isVercelRuntime } from './config/env';

let initPromise: Promise<void> | null = null;
let initCompleted = false;

/**
 * Serverless-safe one-time initialization per warm instance:
 * - Ensures Admin account exists
 * - Seeds base categories & platform settings if database is empty
 * - Registers Telegram 24/7 Cloud Webhook on Vercel runtime
 */
export async function ensureAppReady(requestOrigin?: string): Promise<void> {
  if (initCompleted) return;
  if (isVercelRuntime && !isDatabaseConfigured) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await AuthService.bootstrapAdmin();

        const categoryCount = await prisma.category.count();
        if (categoryCount === 0) {
          console.log('[Bootstrap] Seeding default categories and platform settings...');
          await seedCategoriesAndSettings(prisma);
        }

        if (isVercelRuntime && (process.env.TELEGRAM_BOT_TOKEN || '').length > 0) {
          const origin = requestOrigin || getPublicApiOrigin();
          await TelegramBotRunner.ensureWebhook(origin).catch((err) => {
            console.warn('[Bootstrap] Telegram webhook auto-sync warning:', err.message);
          });
        }

        initCompleted = true;
      } catch (err: any) {
        console.warn('[Bootstrap] Initialization deferred:', err?.message || err);
        initPromise = null;
      }
    })();
  }

  await initPromise;
}
