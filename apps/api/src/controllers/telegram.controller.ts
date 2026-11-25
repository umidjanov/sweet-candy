import { Request, Response, NextFunction } from 'express';
import { TelegramService } from '../integrations/telegram/telegram.service';
import { TelegramBotRunner } from '../integrations/telegram/telegram-bot.runner';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../config/database';
import { env, getPublicApiOrigin } from '../config/env';

export class TelegramController {
  static async getConnectToken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const data = await TelegramService.generateConnectionToken(req.user.sellerId);
      return sendSuccess(res, data, 'Connection token generated (valid for 15 minutes)');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'TOKEN_GENERATION_FAILED');
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');

      const seller = await prisma.sellerProfile.findUnique({
        where: { id: req.user.sellerId },
        select: {
          telegramConnected: true,
          telegramChatId: true,
        },
      });

      const logs = await prisma.telegramNotification.findMany({
        where: { sellerId: req.user.sellerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return sendSuccess(res, {
        connected: !!seller?.telegramConnected,
        chatId: seller?.telegramChatId ? String(seller.telegramChatId) : null,
        recentNotifications: logs,
      });
    } catch (err) {
      next(err);
    }
  }

  static async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');

      await prisma.sellerProfile.update({
        where: { id: req.user.sellerId },
        data: {
          telegramConnected: false,
          telegramChatId: null,
        },
      });

      return sendSuccess(res, null, 'Telegram unlinked successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'DISCONNECT_FAILED');
    }
  }

  /**
   * Public Telegram Bot Webhook endpoint for 24/7 serverless operation.
   * Handles all bot commands, menu buttons, callbacks, and seller deep-linking.
   */
  static async handleWebhook(req: Request, res: Response, _next: NextFunction) {
    try {
      const update = req.body;
      const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;

      if (!update || (!update.message && !update.callback_query)) {
        return res.status(200).json({ ok: true });
      }

      if (!token) {
        // Fallback: still process seller /start <token> deep links if bot token isn't configured
        const text = update.message?.text?.trim() || '';
        const chatId = update.message?.chat?.id;
        if (chatId && text.startsWith('/start ')) {
          const connToken = text.replace('/start ', '').trim();
          const result = await TelegramService.handleTelegramStartCommand(chatId, connToken);
          return res.status(200).json({ ok: true, result });
        }
        return res.status(200).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' });
      }

      await TelegramBotRunner.handleUpdate(token, update);
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('Telegram webhook error:', err);
      // Always return 200 to Telegram so it doesn't endlessly retry a malformed update
      return res.status(200).json({ ok: false, error: err.message });
    }
  }

  /**
   * Syncs/registers Telegram Webhook, slash commands, and Web App menu button for the active cloud origin.
   */
  static async syncWebhook(req: Request, res: Response) {
    const forwardedProto = req.get('x-forwarded-proto');
    const host = req.get('x-forwarded-host') || req.get('host');
    const origin =
      host && !host.includes('localhost') && !host.includes('127.0.0.1')
        ? `${forwardedProto || 'https'}://${host}`
        : getPublicApiOrigin();

    const result = await TelegramBotRunner.ensureWebhook(origin, true);
    return sendSuccess(res, result, result.message, result.ok ? 200 : 400);
  }

  /**
   * Reports live Telegram getWebhookInfo status.
   */
  static async getWebhookInfo(_req: Request, res: Response) {
    const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return sendError(res, 'TELEGRAM_BOT_TOKEN not configured', 400, 'BOT_TOKEN_MISSING');
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const data = await response.json();
      return sendSuccess(res, data.result || data);
    } catch (err: any) {
      return sendError(res, err.message, 500, 'WEBHOOK_INFO_FAILED');
    }
  }
}
