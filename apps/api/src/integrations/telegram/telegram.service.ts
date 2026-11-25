import crypto from 'crypto';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env, getPublicAppUrl } from '../../config/env';

export class TelegramService {
  /**
   * Escapes Telegram legacy Markdown v1 special characters in dynamic values.
   */
  static escapeMarkdown(text: string): string {
    return String(text || '').replace(/([_*`\[])/g, '\\$1');
  }

  private static getBotToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '';
  }

  private static getBotUsername(): string {
    return (process.env.TELEGRAM_BOT_USERNAME || env.TELEGRAM_BOT_USERNAME || 'sweet_candy_uz_bot').replace(/^@/, '');
  }

  /**
   * Generates a compact (<64 chars) HMAC-signed Telegram deep-link token for a customer/user
   */
  static generateCustomerLinkToken(userId: string): { token: string; botUrl: string } {
    const cleanId = userId.replace(/-/g, '').toLowerCase();
    const expSec = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const expStr = expSec.toString(36);
    const base = `c_${cleanId}_${expStr}`;
    const sig = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(base)
      .digest('base64url')
      .slice(0, 16);
    const token = `${base}_${sig}`;
    const botUrl = `https://t.me/${this.getBotUsername()}?start=${token}`;
    return { token, botUrl };
  }

  static verifyCustomerLinkToken(token: string): string | null {
    const parts = token.trim().split('_');
    if (parts.length !== 4 || parts[0] !== 'c') return null;
    const [, cleanId, expStr, sig] = parts;
    if (!cleanId || !expStr || !sig) return null;

    const expSec = parseInt(expStr, 36);
    if (!Number.isFinite(expSec) || expSec < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const base = `c_${cleanId}_${expStr}`;
    const expectedSig = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(base)
      .digest('base64url')
      .slice(0, 16);

    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    if (/^[0-9a-f]{32}$/i.test(cleanId)) {
      return `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(12, 16)}-${cleanId.slice(16, 20)}-${cleanId.slice(20, 32)}`;
    }
    return cleanId;
  }

  static verifyWebAppInitData(initData: string): { telegramId: string; username?: string } | null {
    const botToken = this.getBotToken();
    if (!botToken || !initData) return null;

    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      const userRaw = params.get('user');
      if (!hash || !userRaw) return null;

      const pairs: string[] = [];
      params.forEach((value, key) => {
        if (key !== 'hash') pairs.push(`${key}=${value}`);
      });
      pairs.sort();
      const dataCheckString = pairs.join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(computed, 'hex');
      if (a.length === 0 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
      }

      const parsed = JSON.parse(userRaw);
      if (!parsed?.id) return null;
      return {
        telegramId: String(parsed.id),
        username: parsed.username ? String(parsed.username) : undefined,
      };
    } catch {
      return null;
    }
  }

  static async linkCustomerChatId(userId: string, chatId: number | string | bigint, username?: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: BigInt(chatId),
        ...(username !== undefined ? { telegramUsername: username } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramChatId: true,
        telegramUsername: true,
      },
    });
  }

  static async handleCustomerTelegramStart(
    chatId: number | string,
    token: string,
    username?: string
  ): Promise<{ success: boolean; message: string; userName?: string }> {
    const userId = this.verifyCustomerLinkToken(token);
    if (!userId) {
      return { success: false, message: 'Ushbu ulanish havolasi eskirgan yoki noto‘g‘ri.' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: 'Foydalanuvchi topilmadi.' };
    }

    await this.linkCustomerChatId(userId, chatId, username);

    const activeOrders = await prisma.order.findMany({
      where: {
        customerId: userId,
        status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
      },
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const appUrl = getPublicAppUrl();
    const orderLines = activeOrders.map((ord) => {
      const tracking = ord.trackingUrl ? `\n   📍 Yandex link: ${ord.trackingUrl}` : '';
      return `• *#${this.escapeMarkdown(ord.orderNumber)}* (${this.escapeMarkdown(ord.seller.storeName)}) — *${this.formatStatusUz(ord.status)}*${tracking}`;
    });

    const summary =
      orderLines.length > 0
        ? `\n\n📦 *Faol buyurtmalaringiz:*\n${orderLines.join('\n')}`
        : '';

    await this.sendDirectMessage(
      chatId,
      `✅ *Telegram xabarnomalar yoqildi!*\n\nSalom, *${this.escapeMarkdown(user.firstName)}*! Endi buyurtmangiz qabul qilinishi, tayyorlanishi, tayyor bo‘lishi va Yandex yetkazib berish havolasi to‘g‘ridan-to‘g‘ri shu botga keladi.${summary}`,
      {
        inline_keyboard: [
          [{ text: '📦 Buyurtmalarim (Sayt)', web_app: { url: `${appUrl}/account/orders` } }],
        ],
      }
    );

    return { success: true, message: 'Customer linked', userName: `${user.firstName} ${user.lastName}` };
  }

  static async linkCustomerByPhone(
    chatId: number | string,
    rawPhone: string,
    username?: string
  ): Promise<{ matchedCount: number }> {
    const digits = rawPhone.replace(/\D/g, '');
    const last9 = digits.slice(-9);
    if (last9.length < 7) return { matchedCount: 0 };

    const matchingUsers = await prisma.user.findMany({
      where: { phone: { endsWith: last9 } },
      select: { id: true, firstName: true },
    });

    if (matchingUsers.length === 0) return { matchedCount: 0 };

    await Promise.all(
      matchingUsers.map((u) => this.linkCustomerChatId(u.id, chatId, username))
    );

    return { matchedCount: matchingUsers.length };
  }

  static formatStatusUz(status: string): string {
    switch (status) {
      case 'PENDING':
        return '⏳ Tasdiqlash kutilmoqda';
      case 'ACCEPTED':
        return '✅ Qabul qilindi';
      case 'PREPARING':
        return '👨‍🍳 Tayyorlanmoqda';
      case 'READY':
        return '📦 Tayyor';
      case 'OUT_FOR_DELIVERY':
        return '🚚 Dastafka yo‘lga chiqdi';
      case 'COMPLETED':
        return '🎉 Topshirildi (Yakunlandi)';
      case 'REJECTED':
        return '❌ Rad etildi';
      case 'CANCELLED':
        return '🚫 Bekor qilindi';
      default:
        return status;
    }
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
        .map((item) => {
          const unit = Number(item.unitPriceSnapshot ?? Number(item.lineTotal) / Math.max(1, item.quantity));
          return `• ${this.escapeMarkdown(item.productNameSnapshot)} x${item.quantity} × ${unit.toLocaleString('ru-RU')} = ${Number(item.lineTotal).toLocaleString('ru-RU')} ${order.currency}`;
        })
        .join('\n');

      const formattedSubtotal = Number(order.subtotal).toLocaleString('ru-RU');
      const formattedDeliveryFee = Number(order.deliveryFee).toLocaleString('ru-RU');
      const formattedTotal = Number(order.total).toLocaleString('ru-RU');
      const formattedDate = new Date(order.requestedDate).toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const messageText =
        `🔔 *SIZGA YANGI BUYURTMA KELDI — Sweet CANDY*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Do‘kon:* ${this.escapeMarkdown(order.seller.storeName)}\n` +
        `*Buyurtma raqami:* #${this.escapeMarkdown(order.orderNumber)}\n` +
        `*Xaridor:* ${this.escapeMarkdown(order.customerName)}\n` +
        `*Telefon:* ${this.escapeMarkdown(order.customerPhone)}\n\n` +
        `*Buyurtma tarkibi (${order.items.length} xil):*\n${itemsSummary}\n\n` +
        `*Yetkazish sanasi:* ${this.escapeMarkdown(formattedDate)}\n` +
        `*Yetkazish vaqti:* ${this.escapeMarkdown(order.requestedTime)}\n` +
        `*Yetkazish turi:* ${order.deliveryType === 'DELIVERY' ? '🚚 Yetkazib berish' : '🏪 Olib ketish'}\n` +
        (order.deliveryAddress ? `*Yetkazish manzili:* ${this.escapeMarkdown(order.deliveryAddress)}\n` : '') +
        `*Mahsulotlar summasi:* ${formattedSubtotal} ${order.currency}\n` +
        (order.deliveryType === 'DELIVERY' ? `*Yetkazib berish haqi:* ${formattedDeliveryFee} ${order.currency}\n` : '') +
        `*Umumiy jami summa:* ${formattedTotal} ${order.currency}\n` +
        (order.customerMessage ? `*Mijoz izohi:* "${this.escapeMarkdown(order.customerMessage)}"\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Buyurtmani qabul qilish yoki boshqarish uchun quyidagi tugmalardan foydalaning 👇`;

      const appUrl = getPublicAppUrl();

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '✅ Qabul qilish', callback_data: `order_accept:${order.id}` },
            { text: '❌ Rad etish', callback_data: `order_reject:${order.id}` },
          ],
          [
            {
              text: '📋 Buyurtmani boshqarish (Sayt)',
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
   * Sends real-time order status updates and Yandex Delivery tracking link to the customer's Telegram chat.
   */
  static async sendCustomerOrderStatusNotification(
    orderId: string,
    newStatus: OrderStatus,
    options?: { trackingUrl?: string; rejectionReason?: string }
  ): Promise<{ delivered: boolean; reason?: string }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              telegramChatId: true,
            },
          },
          seller: {
            select: {
              id: true,
              storeName: true,
              publicPhone: true,
            },
          },
        },
      });

      if (!order) {
        return { delivered: false, reason: 'ORDER_NOT_FOUND' };
      }

      if (!order.customer?.telegramChatId) {
        return { delivered: false, reason: 'CUSTOMER_NOT_LINKED' };
      }

      const appUrl = getPublicAppUrl();
      const trackingUrl = options?.trackingUrl || order.trackingUrl || '';
      const orderNum = this.escapeMarkdown(order.orderNumber);
      const storeName = this.escapeMarkdown(order.seller.storeName);
      const custName = this.escapeMarkdown(order.customerName || order.customer.firstName);

      let text = '';
      const inlineRows: any[] = [];

      switch (newStatus) {
        case 'ACCEPTED':
          text =
            `✅ *Buyurtmangiz qabul qilindi! — Sweet CANDY*\n\n` +
            `Salom, *${custName}*!\n` +
            `*#${orderNum}* raqamli buyurtmangiz *${storeName}* do‘koni tomonidan qabul qilindi.`;
          break;
        case 'PREPARING':
          text =
            `👨‍🍳 *Buyurtmangiz tayyorlanmoqda! — Sweet CANDY*\n\n` +
            `*#${orderNum}* raqamli buyurtmangizni *${storeName}* qandolatchisi tayyorlashni boshladi.`;
          break;
        case 'READY':
          text =
            `📦 *Buyurtmangiz tayyor! — Sweet CANDY*\n\n` +
            `*#${orderNum}* raqamli buyurtmangiz *${storeName}* tomonidan tayyor qilindi!\n` +
            (order.deliveryType === 'DELIVERY'
              ? `Tez orada yetkazib berishga chiqariladi.`
              : `Olib ketishingiz mumkin.`);
          break;
        case 'OUT_FOR_DELIVERY':
          text =
            `🚚 *Buyurtmangiz yo‘lga chiqdi! — Sweet CANDY*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Salom, *${custName}*!\n` +
            `*#${orderNum}* raqamli buyurtmangiz tayyor bo‘ldi va kuryer orqali jo‘natildi.\n` +
            `⏳ *Buyurtmangiz tez orada keladi!*\n\n` +
            `🏪 *Do‘kon:* ${storeName}\n` +
            (trackingUrl
              ? `\n📍 *Yandex yetkazib berish havolasi:*\n${trackingUrl}`
              : '');
          if (trackingUrl && /^https?:\/\//i.test(trackingUrl)) {
            inlineRows.push([{ text: '📍 Yandex xaritadan kuzatish', url: trackingUrl }]);
          }
          break;
        case 'COMPLETED':
          text =
            `🎉 *Buyurtmangiz topshirildi! — Sweet CANDY*\n\n` +
            `*#${orderNum}* raqamli buyurtmangiz muvaffaqiyatli yakunlandi. Yoqimli ishtaha!`;
          break;
        case 'REJECTED':
          text =
            `❌ *Buyurtma holati — Sweet CANDY*\n\n` +
            `Afsuski, *#${orderNum}* raqamli buyurtmangiz qabul qilinmadi.\n` +
            (options?.rejectionReason
              ? `Sabab: _${this.escapeMarkdown(options.rejectionReason)}_`
              : '');
          break;
        default:
          text =
            `ℹ️ *Buyurtma #${orderNum} holati yangilandi:* ${this.formatStatusUz(newStatus)}`;
      }

      inlineRows.push([
        { text: '📦 Buyurtmani saytda ko‘rish', web_app: { url: `${appUrl}/account/orders/${order.id}` } },
      ]);

      const result = await this.sendDirectMessage(order.customer.telegramChatId.toString(), text, {
        inline_keyboard: inlineRows,
      });

      if (!result.ok) {
        return { delivered: false, reason: result.description || 'TELEGRAM_SEND_FAILED' };
      }

      return { delivered: true };
    } catch (err: any) {
      return { delivered: false, reason: err?.message || 'TELEGRAM_ERROR' };
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

      const data = await response.json();
      if (!data.ok && String(data.description || '').includes('parse entities')) {
        const fallbackRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId.toString(),
            text: text.replace(/[*_`]/g, ''),
            reply_markup: replyMarkup,
          }),
        });
        return await fallbackRes.json();
      }
      return data;
    } catch (error: any) {
      return { ok: false, description: error.message };
    }
  }
}

