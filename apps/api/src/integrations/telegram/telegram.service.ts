import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env, getPublicAppUrl } from '../../config/env';

export class TelegramService {
  private static getBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '';
  }

  private static getBotUsername(): string {
    return (process.env.TELEGRAM_BOT_USERNAME || env.TELEGRAM_BOT_USERNAME || 'sweet_candy_uz_bot').replace(/^@/, '');
  }

  /**
   * Generates a 15-minute one-time cryptographic token for seller connection
   */
  static async generateConnectionToken(sellerId: string): Promise<{ token: string; botUrl: string }> {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate previous unused tokens for this seller
    await prisma.telegramConnection.updateMany({
      where: { sellerId, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.telegramConnection.create({
      data: {
        sellerId,
        token,
        expiresAt,
      },
    });

    const botUrl = `https://t.me/${this.getBotUsername()}?start=${token}`;
    return { token, botUrl };
  }

  /**
   * Processes deep-link token from Telegram bot webhook or bot polling
   */
  static async handleTelegramStartCommand(chatId: number | string, token: string): Promise<{ success: boolean; message: string; sellerName?: string }> {
    const connection = await prisma.telegramConnection.findUnique({
      where: { token },
      include: { seller: true },
    });

    if (!connection) {
      return { success: false, message: 'Invalid or unrecognized connection token.' };
    }

    if (connection.isUsed) {
      return { success: false, message: 'This connection token has already been used.' };
    }

    if (new Date() > connection.expiresAt) {
      return { success: false, message: 'This connection token has expired. Please generate a new one from your dashboard.' };
    }

    // Mark token as used and associate chat_id with seller
    await prisma.$transaction([
      prisma.telegramConnection.update({
        where: { id: connection.id },
        data: { isUsed: true },
      }),
      prisma.sellerProfile.update({
        where: { id: connection.sellerId },
        data: {
          telegramConnected: true,
          telegramChatId: BigInt(chatId),
        },
      }),
    ]);

    // Send welcome confirmation to the seller
    const welcomeText =
      `🎉 *SweetMarket Connected Successfully!*\n\n` +
      `Your store *${connection.seller.storeName}* is now linked.\n` +
      `You will receive instant alerts right here whenever customers place orders for your sweets.`;

    await this.sendDirectMessage(chatId, welcomeText);

    return {
      success: true,
      message: 'Store linked successfully',
      sellerName: connection.seller.storeName,
    };
  }

  /**
   * Formats and dispatches new order notification to the assigned seller
   */
  static async sendOrderNotification(orderId: string): Promise<{ delivered: boolean; error?: string }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          seller: true,
        },
      });

      if (!order) {
        return { delivered: false, error: 'Order not found' };
      }

      if (!order.seller.telegramConnected || !order.seller.telegramChatId) {
        return { delivered: false, error: 'Seller has not connected Telegram' };
      }

      // Check if duplicate notification was already delivered
      const existing = await prisma.telegramNotification.findFirst({
        where: {
          orderId,
          sellerId: order.sellerId,
          isDelivered: true,
        },
      });

      if (existing) {
        return { delivered: true };
      }

      const itemsSummary = order.items
        .map((item) => `• ${item.productNameSnapshot} x${item.quantity} (${Number(item.lineTotal).toLocaleString()} ${order.currency})`)
        .join('\n');

      const formattedTotal = Number(order.total).toLocaleString('ru-RU');
      const formattedDate = new Date(order.requestedDate).toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const messageText =
        `🔔 *YANGI BUYURTMA — Sweet CANDY*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Buyurtma raqami:* #${order.orderNumber}\n` +
        `*Xaridor:* ${order.customerName}\n` +
        `*Telefon:* ${order.customerPhone}\n\n` +
        `*Buyurtma tarkibi:*\n${itemsSummary}\n\n` +
        `*Yetkazish sanasi:* ${formattedDate}\n` +
        `*Yetkazish vaqti:* ${order.requestedTime}\n` +
        `*Yetkazish turi:* ${order.deliveryType === 'DELIVERY' ? '🚚 Yetkazib berish' : '🏪 Olib ketish'}\n` +
        (order.deliveryAddress ? `*Yetkazish manzili:* ${order.deliveryAddress}\n` : '') +
        `*Jami summa:* ${formattedTotal} ${order.currency}\n` +
        (order.customerMessage ? `*Mijoz izohi:* "${order.customerMessage}"\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Buyurtmani qabul qilish yoki holatini o'zgartirish uchun quyidagi tugmani bosing 👇`;

      const appUrl = getPublicAppUrl();

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '📋 Buyurtmani boshqarish (Web App)',
              web_app: { url: `${appUrl}/seller/orders/${order.id}` },
            },
          ],
        ],
      };

      const notificationLog = await prisma.telegramNotification.create({
        data: {
          orderId: order.id,
          sellerId: order.sellerId,
          chatId: order.seller.telegramChatId,
          messagePayload: messageText,
          isDelivered: false,
        },
      });

      const botToken = this.getBotToken();

      // If no BOT token is configured, log in development mode
      if (!botToken) {
        console.warn(`[Telegram Simulator] No TELEGRAM_BOT_TOKEN set. Notification logged for chat ${order.seller.telegramChatId}`);
        await prisma.telegramNotification.update({
          where: { id: notificationLog.id },
          data: {
            isDelivered: false,
            errorMessage: 'TELEGRAM_BOT_TOKEN not configured in environment',
          },
        });
        return { delivered: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
      }

      // Send to Telegram API
      const result = await this.sendDirectMessage(order.seller.telegramChatId.toString(), messageText, replyMarkup);

      if (result.ok) {
        await prisma.telegramNotification.update({
          where: { id: notificationLog.id },
          data: {
            isDelivered: true,
            sentAt: new Date(),
          },
        });
        return { delivered: true };
      } else {
        await prisma.telegramNotification.update({
          where: { id: notificationLog.id },
          data: {
            isDelivered: false,
            retryCount: 1,
            errorMessage: result.description || 'Failed to deliver to Telegram',
          },
        });
        return { delivered: false, error: result.description };
      }
    } catch (err: any) {
      console.error('Error sending Telegram notification:', err);
      return { delivered: false, error: err.message };
    }
  }

  /**
   * Dispatches direct HTTP POST request to Telegram sendMessage API
   */
  static async sendDirectMessage(
    chatId: string | number | bigint,
    text: string,
    replyMarkup?: any
  ): Promise<{ ok: boolean; description?: string }> {
    const botToken = this.getBotToken();
    if (!botToken) {
      return { ok: false, description: 'Telegram Bot Token not configured' };
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.toString(),
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });

      return await response.json();
    } catch (error: any) {
      return { ok: false, description: error.message };
    }
  }
}

