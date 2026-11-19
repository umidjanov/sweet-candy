import { Request, Response, NextFunction } from 'express';
import { TelegramService } from '../integrations/telegram/telegram.service';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../config/database';

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
   * Webhook endpoint called by Telegram Bot or local verification
   * Handles `/start <token>` payload
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const message = req.body?.message;
      if (!message || !message.text) {
        return res.status(200).json({ ok: true });
      }

      const text = message.text.trim();
      const chatId = message.chat.id;

      if (text.startsWith('/start ')) {
        const token = text.replace('/start ', '').trim();
        const result = await TelegramService.handleTelegramStartCommand(chatId, token);
        return res.status(200).json({ ok: true, result });
      }

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('Telegram webhook error:', err);
      return res.status(200).json({ ok: false, error: err.message });
    }
  }
}

