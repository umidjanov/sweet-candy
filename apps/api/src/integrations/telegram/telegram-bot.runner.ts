import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { env, getPublicAppUrl } from '../../config/env';
import { TelegramService } from './telegram.service';
import { OrderService } from '../../services/order.service';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    contact?: {
      phone_number: string;
      first_name: string;
      last_name?: string;
      user_id?: number;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: { id: number };
    };
    data?: string;
  };
}

export class TelegramBotRunner {
  private static isRunning = false;
  private static offset = 0;
  private static pollingAbortController: AbortController | null = null;

  /**
   * Ensures Telegram Webhook, bot slash commands, and Web App menu button are registered for 24/7 serverless mode.
   */
  public static async ensureWebhook(
    apiOrigin: string,
    forceSync = false
  ): Promise<{ ok: boolean; webhookUrl?: string; message: string }> {
    const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return { ok: false, message: 'TELEGRAM_BOT_TOKEN is not configured' };
    }

    const cleanOrigin = apiOrigin.replace(/\/+$/, '');
    const targetWebhookUrl = `${cleanOrigin}/api/v1/telegram/webhook`;

    try {
      const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const infoData = await infoRes.json();

      const currentUrl: string = infoData?.result?.url || '';
      const needsWebhookSet = currentUrl !== targetWebhookUrl;

      if (needsWebhookSet) {
        const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetWebhookUrl,
            allowed_updates: ['message', 'callback_query'],
            drop_pending_updates: false,
          }),
        });
        const setData = await setRes.json();
        if (!setData.ok) {
          return { ok: false, webhookUrl: currentUrl, message: setData.description || 'setWebhook failed' };
        }
      }

      if (needsWebhookSet || forceSync) {
        await Promise.all([this.setupCommands(token), this.setupMenuButton(token)]);
      }

      return { ok: true, webhookUrl: targetWebhookUrl, message: 'Telegram 24/7 webhook active' };
    } catch (err: any) {
      return { ok: false, message: err.message };
    }
  }

  /**
   * Initializes and starts the Telegram Bot polling loop (for local dev only when cloud webhook isn't active)
   */
  static async start(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log('----------------------------------------------------');
      console.log('🤖 [Telegram Bot] TELEGRAM_BOT_TOKEN sozlanmagan.');
      console.log('ℹ️ Botni faollashtirish uchun .env faylida TELEGRAM_BOT_TOKEN ni kiriting.');
      console.log('ℹ️ Bot tokeningizni Telegram-dagi @BotFather orqali olishingiz mumkin.');
      console.log('----------------------------------------------------');
      return;
    }

    // Do not hijack an active 24/7 cloud HTTPS webhook from local laptop polling unless explicitly forced
    if (process.env.TELEGRAM_FORCE_POLLING !== 'true') {
      try {
        const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const infoData = await infoRes.json();
        const activeWebhook: string = infoData?.result?.url || '';
        if (activeWebhook && activeWebhook.startsWith('https://') && !activeWebhook.includes('trycloudflare.com') && !activeWebhook.includes('loca.lt')) {
          console.log(`🤖 [Telegram Bot] 24/7 Cloud Webhook allaqachon aktiv (${activeWebhook}). Lokal polling o'tkazib yuborildi.`);
          return;
        }
      } catch {
        // Continue to polling check
      }
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.pollingAbortController = new AbortController();

    try {
      // 1. Verify Bot Token & Get Bot Info (with 429 retry handling)
      let botUser: any = null;
      let consecutive429 = 0;
      while (!botUser && this.isRunning) {
        try {
          const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
          const meData = await meRes.json();

          if (meData.ok) {
            botUser = meData.result;
            break;
          } else if (meData.error_code === 429) {
            consecutive429++;
            const waitSec = consecutive429 > 2 ? 60 : (meData.parameters?.retry_after || 30) + 5;
            if (consecutive429 > 2) {
              console.warn(`[Telegram Bot] ⚠️ Telegram ushbu token uchun flood-control (429) qo‘ymoqda. 60 soniya kutilmoqda... (Agar davom etsa, @BotFather orqali token qayta olinadi)`);
            } else {
              console.warn(`[Telegram Bot] 429 Telegram cheklovi: ${waitSec} soniya kutilmoqda...`);
            }
            await new Promise((r) => setTimeout(r, waitSec * 1000));
          } else {
            console.error('❌ [Telegram Bot] Token noto‘g‘ri yoki Telegram API ulanmadi:', meData.description);
            this.isRunning = false;
            return;
          }
        } catch (e: any) {
          await new Promise((r) => setTimeout(r, 15000));
        }
      }

      if (!botUser) {
        console.error('❌ [Telegram Bot] Bot ma’lumotlarini olib bo‘lmadi.');
        this.isRunning = false;
        return;
      }

      console.log(`🤖 [Telegram Bot] @${botUser.username} muvaffaqiyatli ishga tushdi!`);

      // 2. Configure Telegram Menu Commands
      await this.setupCommands(token);

      // 3. Configure Telegram Chat Menu Web App Button
      await this.setupMenuButton(token);

      // 4. Start polling in background loop
      this.poll(token).catch((err) => {
        console.error('[Telegram Bot Polling Error]:', err);
      });
    } catch (err: any) {
      console.error('❌ [Telegram Bot] Ishga tushirishda xatolik:', err.message);
      this.isRunning = false;
    }
  }

  /**
   * Escapes Telegram legacy Markdown v1 special characters in dynamic user/product values.
   */
  private static escapeMarkdown(text: string): string {
    return TelegramService.escapeMarkdown(text);
  }

  /**
   * Registers default slash commands and bot descriptions
   */
  private static async setupCommands(token: string) {
    try {
      const commands = [
        { command: 'start', description: 'Bosh menyu (5 ta tugma) va bot haqida' },
        { command: 'menu', description: 'Shirinliklar (barchasi rasm va ma’lumot bilan)' },
        { command: 'prices', description: 'Narxlar (shirinliklar va narxlari)' },
        { command: 'orders', description: 'Mening buyurtmalarim' },
        { command: 'seller', description: 'Qandolatchi / Sotuvchi kabineti' },
        { command: 'app', description: 'Saytni ochish va Login' },
        { command: 'help', description: 'Bot haqida va Yordam' },
      ];

      await Promise.all([
        fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commands }),
        }),
        fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            short_description:
              'Sweet CANDY — uy qandolatchilari, maxsus tortlar va shirinliklarga 24/7 onlayn buyurtma berish boti.',
          }),
        }),
        fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description:
              '🍭 Sweet CANDY rasmiy Telegram botiga xush kelibsiz!\n\n' +
              '• Tayyor va buyurtmaga maxsus tortlar, desertlar hamda pishiriqlar katalogi\n' +
              '• Telegram Web App orqali 24/7 qulay onlayn buyurtma berish\n' +
              '• Buyurtma holatini kuzatish va qandolatchilar uchun tezkor xabarnomalar\n\n' +
              'Boshlash uchun /start tugmasini bosing!',
          }),
        }),
      ]);
    } catch (err: any) {
      console.warn('Telegram setMyCommands warning:', err.message);
    }
  }

  /**
   * Helper to resolve the active HTTPS Web App URL
   */
  public static getWebAppBaseUrl(): string {
    return getPublicAppUrl();
  }

  /**
   * Sets the permanent Web App button in the Telegram chat input
   */
  private static async setupMenuButton(token: string) {
    try {
      const webAppUrl = this.getWebAppBaseUrl();
      await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: '🧁 Ilovani ochish',
            web_app: { url: webAppUrl },
          },
        }),
      });
    } catch (err: any) {
      console.warn('Telegram setChatMenuButton warning:', err.message);
    }
  }

  /**
   * Continuous Long-Polling worker
   */
  private static async poll(token: string) {
    while (this.isRunning) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.offset}&timeout=20`;
        const res = await fetch(url, { signal: this.pollingAbortController?.signal });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result as TelegramUpdate[]) {
            this.offset = update.update_id + 1;
            await this.handleUpdate(token, update).catch((e) => {
              console.error('[Telegram Update Handle Error]:', e);
            });
          }
        } else if (data.error_code === 429) {
          const waitSec = data.parameters?.retry_after || 15;
          console.warn(`[Telegram Bot] 429 Rate limit: ${waitSec} soniya kutilmoqda...`);
          await new Promise((r) => setTimeout(r, waitSec * 1000));
        } else if (data.error_code === 409) {
          // Conflict: webhook or other polling instance running
          console.warn('[Telegram Bot] 409 Conflict: boshqa bot instansiyasi ishlab turibdi. 5 soniya kutilmoqda...');
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        // Wait before reconnecting to prevent thrashing
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  /**
   * Bottom ReplyKeyboard builders:
   * - Main menu always shows 5 clickable buttons
   * - Each sub-section swaps the bottom keyboard to 4 contextual buttons (4th = Ortga qaytish)
   */
  private static getMainKeyboard() {
    return {
      keyboard: [
        [{ text: '🍰 Shirinliklar' }, { text: '💰 Narxlar' }],
        [{ text: '📦 Buyurtmalarim' }, { text: '👨‍🍳 Qandolatchi kabineti' }],
        [{ text: '🌐 Saytni ochish & Login' }],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  private static getProductsKeyboard(webAppUrl: string) {
    return {
      keyboard: [
        [
          { text: '🛍️ To‘liq katalog (Sayt)', web_app: { url: `${webAppUrl}/explore` } },
          { text: '💰 Narxlarni ko‘rish' },
        ],
        [
          { text: '🛒 Savatcha', web_app: { url: `${webAppUrl}/cart` } },
          { text: '⬅️ Ortga qaytish' },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  private static getPricesKeyboard() {
    return {
      keyboard: [
        [{ text: '📉 Arzondan qimmatga' }, { text: '📈 Qimmatdan arzonga' }],
        [{ text: '🍰 Rasmlar bilan ko‘rish' }, { text: '⬅️ Ortga qaytish' }],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  private static getOrdersKeyboard(webAppUrl: string) {
    return {
      keyboard: [
        [
          { text: '📋 Buyurtmalarimni ochish', web_app: { url: `${webAppUrl}/account/orders` } },
          { text: '🛒 Yangi buyurtma', web_app: { url: `${webAppUrl}/explore` } },
        ],
        [
          { text: '🛍️ Savatcha', web_app: { url: `${webAppUrl}/cart` } },
          { text: '⬅️ Ortga qaytish' },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  private static getSellerKeyboard(webAppUrl: string) {
    return {
      keyboard: [
        [
          { text: '📊 Sotuvchi Paneli', web_app: { url: `${webAppUrl}/seller/dashboard` } },
          { text: '➕ Shirinlik qo‘shish', web_app: { url: `${webAppUrl}/seller/products/new` } },
        ],
        [
          { text: '📦 Kelgan buyurtmalar', web_app: { url: `${webAppUrl}/seller/orders` } },
          { text: '⬅️ Ortga qaytish' },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  private static getSiteLoginKeyboard(webAppUrl: string) {
    return {
      keyboard: [
        [
          { text: '🚀 Saytni ochish', web_app: { url: webAppUrl } },
          { text: '🔐 Login (Kirish)', web_app: { url: `${webAppUrl}/login` } },
        ],
        [
          { text: '📝 Ro‘yxatdan o‘tish', web_app: { url: `${webAppUrl}/register` } },
          { text: '⬅️ Ortga qaytish' },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  /**
   * Dispatches incoming Telegram updates (called by both Webhook in cloud and Polling locally)
   */
  public static async handleUpdate(token: string, update: TelegramUpdate) {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text?.trim() || '';
      const lower = text.toLowerCase();
      const normalizedCmd = text.split(' ')[0].split('@')[0].toLowerCase();
      const firstName = msg.from?.first_name || 'Mehmon';

      // 1. Deep linking start command: /start <token>
      if (normalizedCmd === '/start' && text.includes(' ')) {
        const connToken = text.split(/\s+/).slice(1).join(' ').trim();
        if (connToken) {
          const res = await TelegramService.handleTelegramStartCommand(chatId, connToken);
          if (res.success) {
            await this.sendMessageWithMarkup(
              token,
              chatId,
              `🎉 *Tabriklaymiz!*\n\nSizning *"${this.escapeMarkdown(res.sellerName || '')}"* do‘koningiz muvaffaqiyatli ulandi!\nEndi xaridorlar shirinliklaringizga buyurtma berganda darhol shu yerga xabarnoma keladi.`,
              this.getMainKeyboard()
            );
          } else {
            await this.sendMessageWithMarkup(
              token,
              chatId,
              `⚠️ *Xatolik:* ${this.escapeMarkdown(res.message)}\n\nQaytadan ulash uchun do‘kon boshqaruv panelingizdan yangi token oling.`,
              this.getMainKeyboard()
            );
          }
          return;
        }
      }

      // 2. Back to Main / Start command (shows 5 main buttons + website/login access)
      if (
        normalizedCmd === '/start' ||
        text === '⬅️ Ortga qaytish' ||
        lower.includes('ortga qaytish') ||
        lower === 'bosh menyu'
      ) {
        await this.sendWelcomeMessage(token, chatId, firstName);
        return;
      }

      // 3. Prices section (sorted ascending / descending)
      if (text === '📉 Arzondan qimmatga') {
        await this.sendPricesCatalog(token, chatId, 'asc');
        return;
      }
      if (text === '📈 Qimmatdan arzonga') {
        await this.sendPricesCatalog(token, chatId, 'desc');
        return;
      }
      if (
        normalizedCmd === '/prices' ||
        text === '💰 Narxlar' ||
        text === '💰 Narxlarni ko‘rish' ||
        lower.includes('narx')
      ) {
        await this.sendPricesCatalog(token, chatId, 'asc');
        return;
      }

      // 4. All sweets / Products menu
      if (
        normalizedCmd === '/menu' ||
        text === '🍰 Shirinliklar' ||
        text === '🍰 Rasmlar bilan ko‘rish' ||
        lower.includes('shirinlik')
      ) {
        await this.sendProductsCatalog(token, chatId);
        return;
      }

      // 5. My orders
      if (normalizedCmd === '/orders' || text === '📦 Buyurtmalarim' || lower.includes('buyurtma')) {
        await this.sendMyOrders(token, chatId);
        return;
      }

      // 6. Seller cabinet
      if (
        normalizedCmd === '/seller' ||
        text === '👨‍🍳 Qandolatchi kabineti' ||
        lower.includes('qandolatchi') ||
        lower.includes('sotuvchi')
      ) {
        await this.sendSellerMenu(token, chatId);
        return;
      }

      // 7. Site & Login
      if (
        normalizedCmd === '/app' ||
        normalizedCmd === '/login' ||
        text === '🌐 Saytni ochish & Login' ||
        lower.includes('saytni ochish') ||
        lower.includes('ilovani ochish') ||
        lower.includes('login')
      ) {
        await this.sendSiteAndLoginMenu(token, chatId);
        return;
      }

      // 8. Help & About
      if (normalizedCmd === '/help' || lower.includes('haqimizda') || lower.includes('yordam')) {
        await this.sendHelpMessage(token, chatId);
        return;
      }

      // Default fallback returns main 5-button menu
      await this.sendWelcomeMessage(token, chatId, firstName);
    } else if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      const data = cb.data;

      if (!chatId || !data) return;

      // Handle Seller order action callbacks directly inside Telegram
      if (
        data.startsWith('order_accept:') ||
        data.startsWith('order_reject:') ||
        data.startsWith('order_status:')
      ) {
        await this.handleSellerOrderCallback(token, cb, data);
        return;
      }

      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });

      if (data === 'open_menu') {
        await this.sendProductsCatalog(token, chatId);
      } else if (data === 'open_prices') {
        await this.sendPricesCatalog(token, chatId, 'asc');
      } else if (data === 'open_help') {
        await this.sendHelpMessage(token, chatId);
      } else if (data === 'open_main') {
        await this.sendWelcomeMessage(token, chatId, cb.from?.first_name || 'Mehmon');
      }
    }
  }

  /**
   * Handles inline seller actions ("✅ Qabul qilish", "❌ Rad etish", and lifecycle transitions)
   */
  private static async handleSellerOrderCallback(
    token: string,
    cb: NonNullable<TelegramUpdate['callback_query']>,
    data: string
  ) {
    const chatId = cb.message?.chat.id;
    const messageId = cb.message?.message_id;
    if (!chatId) return;

    const answerCb = async (text: string, showAlert = false) => {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id, text, show_alert: showAlert }),
      });
    };

    try {
      let orderId = '';
      let targetStatus: OrderStatus = 'ACCEPTED';
      let note = '';

      if (data.startsWith('order_accept:')) {
        orderId = data.replace('order_accept:', '').trim();
        targetStatus = 'ACCEPTED';
        note = 'Telegram bot orqali qabul qilindi';
      } else if (data.startsWith('order_reject:')) {
        orderId = data.replace('order_reject:', '').trim();
        targetStatus = 'REJECTED';
        note = 'Sotuvchi tomonidan Telegram orqali rad etildi';
      } else if (data.startsWith('order_status:')) {
        const [, id, statusStr] = data.split(':');
        orderId = id || '';
        targetStatus = statusStr as OrderStatus;
        note = `Telegram bot orqali holat ${targetStatus} ga o‘zgartirildi`;
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { seller: true },
      });

      if (!order) {
        await answerCb('Buyurtma topilmadi.', true);
        return;
      }

      if (!order.seller.telegramChatId || order.seller.telegramChatId.toString() !== String(chatId)) {
        await answerCb('Bu buyurtmani faqat bog‘langan do‘kon egasi boshqara oladi.', true);
        return;
      }

      await OrderService.updateOrderStatus(
        order.id,
        targetStatus,
        order.seller.userId,
        order.sellerId,
        false,
        targetStatus === 'REJECTED' ? { rejectionReason: note } : { sellerNotes: note }
      );

      const webAppUrl = this.getWebAppBaseUrl();
      const statusMessages: Record<string, string> = {
        ACCEPTED: `✅ Buyurtma #${order.orderNumber} qabul qilindi!`,
        PREPARING: `👨‍🍳 Buyurtma #${order.orderNumber} tayyorlanmoqda!`,
        READY: `📦 Buyurtma #${order.orderNumber} tayyor!`,
        OUT_FOR_DELIVERY: `🚚 Buyurtma #${order.orderNumber} yetkazilmoqda!`,
        COMPLETED: `🎉 Buyurtma #${order.orderNumber} tugatildi!`,
        REJECTED: `❌ Buyurtma #${order.orderNumber} rad etildi.`,
      };

      const toastMsg = statusMessages[targetStatus] || `Holat yangilandi: ${targetStatus}`;
      await answerCb(toastMsg);

      const nextInlineKeyboard =
        targetStatus === 'COMPLETED' || targetStatus === 'REJECTED' || targetStatus === 'CANCELLED'
          ? {
              inline_keyboard: [
                [
                  {
                    text: '📋 Saytda buyurtmani ko‘rish',
                    web_app: { url: `${webAppUrl}/seller/orders/${order.id}` },
                  },
                ],
              ],
            }
          : {
              inline_keyboard: [
                [
                  ...(targetStatus === 'ACCEPTED'
                    ? [{ text: '👨‍🍳 Tayyorlanmoqda', callback_data: `order_status:${order.id}:PREPARING` }]
                    : []),
                  ...(targetStatus === 'ACCEPTED' || targetStatus === 'PREPARING'
                    ? [{ text: '📦 Tayyor', callback_data: `order_status:${order.id}:READY` }]
                    : []),
                  { text: '🚚 Yetkazildi (Tugatish)', callback_data: `order_status:${order.id}:COMPLETED` },
                ],
                [
                  {
                    text: '📋 Saytda boshqarish',
                    web_app: { url: `${webAppUrl}/seller/orders/${order.id}` },
                  },
                ],
              ],
            };

      if (messageId) {
        await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            reply_markup: nextInlineKeyboard,
          }),
        });
      }

      await this.sendMessageWithMarkup(
        token,
        chatId,
        `${toastMsg}\nSaytdagi buyurtmalar bo‘limida ham holat avtomatik yangilandi.`
      );
    } catch (err: any) {
      await answerCb(err?.message || 'Holatni yangilashda xatolik', true);
    }
  }

  /**
   * Sends the primary Sweet CANDY Main Menu (5 clickable bottom buttons + inline site/login actions)
   */
  private static async sendWelcomeMessage(token: string, chatId: number, firstName: string) {
    const webAppUrl = this.getWebAppBaseUrl();
    const safeName = this.escapeMarkdown(firstName || 'Mehmon');

    const welcomeText =
      `🍭 *Sweet CANDY — Shirinliklar va Tortlar Platformasi*\n\n` +
      `Assalomu alaykum, *${safeName}*! Sweet CANDY rasmiy Telegram botiga xush kelibsiz.\n\n` +
      `ℹ️ *Bot haqida ma’lumot va bo‘limlar:*\n` +
      `• *🍰 Shirinliklar* (/menu) — Barcha shirinliklarni rasmi va tarkibi bilan ko‘rish\n` +
      `• *💰 Narxlar* (/prices) — Shirinliklar va ularning narxlar ro‘yxati\n` +
      `• *📦 Buyurtmalarim* (/orders) — Buyurtmalaringiz holatini kuzatish\n` +
      `• *👨‍🍳 Qandolatchi kabineti* (/seller) — Do‘kon boshqaruvi va buyurtma xabarnomalari\n` +
      `• *🌐 Saytni ochish & Login* (/app) — Saytga kirish, akkauntga login qilish va ro‘yxatdan o‘tish\n\n` +
      `🌐 *Sayt:* ${webAppUrl}\n` +
      `📞 *Aloqa:* +998 71 200 00 00`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 Saytni ochish (Web App)', web_app: { url: webAppUrl } },
          { text: '🔐 Login (Kirish)', web_app: { url: `${webAppUrl}/login` } },
        ],
        [
          { text: '🍰 Shirinliklar', callback_data: 'open_menu' },
          { text: '💰 Narxlar', callback_data: 'open_prices' },
        ],
        [
          { text: 'ℹ️ Bot haqida & Yordam', callback_data: 'open_help' },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, welcomeText, inlineMarkup);
    await this.sendMessageWithMarkup(
      token,
      chatId,
      '👇 Pastdagi 5 ta asosiy tugmadan kerakli bo‘limni tanlang:',
      this.getMainKeyboard()
    );
  }

  /**
   * Sends Site & Login section with 4 contextual bottom buttons
   */
  private static async sendSiteAndLoginMenu(token: string, chatId: number) {
    const webAppUrl = this.getWebAppBaseUrl();
    const text =
      `🌐 *Saytni ochish va Tizimga kirish (Login)*\n\n` +
      `Sayt orqali to‘liq katalogni ko‘rishingiz, akkauntingizga kirishingiz (Login) yoki yangi xaridor/qandolatchi sifatida ro‘yxatdan o‘tishingiz mumkin:`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 Saytni ochish (Web App)', web_app: { url: webAppUrl } },
          { text: '🔐 Login (Tizimga kirish)', web_app: { url: `${webAppUrl}/login` } },
        ],
        [
          { text: '🛍️ Xaridor sifatida ro‘yxat', web_app: { url: `${webAppUrl}/register/customer` } },
          { text: '👨‍🍳 Do‘kon ochish', web_app: { url: `${webAppUrl}/register/seller` } },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, text, inlineMarkup);
    await this.sendMessageWithMarkup(
      token,
      chatId,
      'Sayt va kirish bo‘limi tugmalari 👇',
      this.getSiteLoginKeyboard(webAppUrl)
    );
  }

  /**
   * Sends ALL sweets with their prices and swaps bottom keyboard to 4 price-section buttons
   */
  private static async sendPricesCatalog(token: string, chatId: number, order: 'asc' | 'desc' = 'asc') {
    const webAppUrl = this.getWebAppBaseUrl();
    const pricesKeyboard = this.getPricesKeyboard();

    try {
      const products = await prisma.product.findMany({
        where: {
          isHiddenByAdmin: false,
          availabilityStatus: { in: ['AVAILABLE', 'PRE_ORDER_ONLY'] },
        },
        include: {
          seller: true,
          category: true,
        },
        orderBy: { price: order },
        take: 50,
      });

      if (!products || products.length === 0) {
        await this.sendMessageWithMarkup(
          token,
          chatId,
          `💰 *Shirinliklar narxlari*\n\nHozircha faol shirinliklar qo‘shilmagan. Sayt orqali katalogga kirishingiz yoki Qandolatchi kabinetidan shirinlik qo‘shishingiz mumkin.`,
          {
            inline_keyboard: [
              [{ text: '🧁 Saytni ochish (Web App)', web_app: { url: `${webAppUrl}/explore` } }],
              [{ text: '➕ Shirinlik qo‘shish', web_app: { url: `${webAppUrl}/seller/products/new` } }],
            ],
          }
        );
        await this.sendMessageWithMarkup(token, chatId, 'Narxlar bo‘limi tugmalari 👇', pricesKeyboard);
        return;
      }

      const sortLabel = order === 'asc' ? 'Arzondan qimmatga' : 'Qimmatdan arzonga';
      const lines = products.map((prod, idx) => {
        const formattedPrice = Number(prod.price).toLocaleString('ru-RU');
        const prep = prod.preparationTimeHours ? `${prod.preparationTimeHours} soat` : 'Darhol';
        return (
          `${idx + 1}. 🍰 *${this.escapeMarkdown(prod.name)}* — *${formattedPrice} ${prod.currency || 'UZS'}*\n` +
          `   🏪 ${this.escapeMarkdown(prod.seller.storeName)} • ⏱️ ${prep}`
        );
      });

      const priceText =
        `💰 *Barcha shirinliklar va narxlar (${sortLabel}):*\n\n` +
        `${lines.join('\n\n')}\n\n` +
        `👇 Buyurtma berish yoki rasmlar bilan ko‘rish uchun tugmalardan foydalaning:`;

      await this.sendMessageWithMarkup(token, chatId, priceText, {
        inline_keyboard: [
          [{ text: '🛒 Saytda buyurtma berish', web_app: { url: `${webAppUrl}/explore` } }],
        ],
      });
      await this.sendMessageWithMarkup(token, chatId, 'Narxlar bo‘limi (4 ta tugma) 👇', pricesKeyboard);
    } catch (err: any) {
      console.error('Error fetching prices for Telegram bot:', err);
      await this.sendMessageWithMarkup(token, chatId, `Narxlarni yuklashda xatolik yuz berdi. Sayt: ${webAppUrl}/explore`, pricesKeyboard);
    }
  }

  /**
   * Sends products catalog directly in Telegram chat with photos & ordering buttons
   */
  private static async sendProductsCatalog(token: string, chatId: number) {
    const webAppUrl = this.getWebAppBaseUrl();

    try {
      const products = await prisma.product.findMany({
        where: {
          isHiddenByAdmin: false,
          availabilityStatus: { in: ['AVAILABLE', 'PRE_ORDER_ONLY'] },
        },
        include: {
          seller: true,
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      const productsKeyboard = this.getProductsKeyboard(webAppUrl);

      if (!products || products.length === 0) {
        await this.sendMessage(
          token,
          chatId,
          `🧁 *Hozircha shirinliklar ro‘yxati bo‘sh.*\n\nBarcha shirinliklarni ko‘rish uchun ilovani oching:`,
          {
            inline_keyboard: [
              [{ text: '🛍️ Ilovani ochish (Web App)', web_app: { url: `${webAppUrl}/explore` } }],
            ],
          }
        );
        await this.sendMessageWithMarkup(token, chatId, 'Shirinliklar bo‘limi (4 ta tugma) 👇', productsKeyboard);
        return;
      }

      await this.sendMessage(token, chatId, `✨ *Barcha shirinliklarimiz (${products.length} ta):* \nQuyidagi har bir shirinlikka shu yerdan turib buyurtma bera olasiz:`);

      for (const prod of products) {
        const imageUrl = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
        const formattedPrice = Number(prod.price).toLocaleString('ru-RU');
        const prepTime = prod.preparationTimeHours ? `${prod.preparationTimeHours} soat` : 'Darhol';

        const caption =
          `🍰 *${this.escapeMarkdown(prod.name)}*\n` +
          `💰 *Narxi:* ${formattedPrice} UZS\n` +
          `⏱️ *Tayyorlanish vaqti:* ${prepTime}\n` +
          `🏪 *Qandolatchi:* ${this.escapeMarkdown(prod.seller.storeName)}\n` +
          (prod.description ? `📝 ${this.escapeMarkdown(prod.description.substring(0, 120))}...\n` : '');

        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '🛒 Buyurtma berish',
                web_app: { url: `${webAppUrl}/products/${prod.id}` },
              },
            ],
            [
              {
                text: '🛍️ To‘liq menyuni ko‘rish',
                web_app: { url: `${webAppUrl}/explore` },
              },
            ],
          ],
        };

        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          await this.sendPhoto(token, chatId, imageUrl, caption, inlineKeyboard);
        } else {
          await this.sendMessageWithMarkup(token, chatId, caption, inlineKeyboard);
        }
      }

      await this.sendMessageWithMarkup(
        token,
        chatId,
        'Shirinliklar bo‘limi (4 ta tugma) 👇',
        productsKeyboard
      );
    } catch (err: any) {
      console.error('Error fetching products for Telegram bot:', err);
      await this.sendMessageWithMarkup(
        token,
        chatId,
        `Xatolik yuz berdi. Iltimos, ilovani oching: ${webAppUrl}`,
        this.getProductsKeyboard(webAppUrl)
      );
    }
  }

  /**
   * Sends user orders view
   */
  private static async sendMyOrders(token: string, chatId: number) {
    const webAppUrl = this.getWebAppBaseUrl();

    const text =
      `📦 *Sizning buyurtmalaringiz*\n\n` +
      `Sayt va Telegram Web App orqali berilgan barcha buyurtmalaringiz, ularning tayyorlanish holati va yetkazish vaqtini ko‘rish uchun quyidagi tugmani bosing:`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '📦 Buyurtmalarimni ko‘rish', web_app: { url: `${webAppUrl}/account/orders` } },
        ],
        [
          { text: '🛍️ Yangi shirinlik buyurtma qilish', web_app: { url: webAppUrl } },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, text, inlineMarkup);
    await this.sendMessageWithMarkup(
      token,
      chatId,
      'Buyurtmalar bo‘limi (4 ta tugma) 👇',
      this.getOrdersKeyboard(webAppUrl)
    );
  }

  /**
   * Sends seller / confectioner dashboard options
   */
  private static async sendSellerMenu(token: string, chatId: number) {
    const webAppUrl = this.getWebAppBaseUrl();

    const text =
      `👨‍🍳 *Qandolatchi va Sotuvchilar kabineti*\n\n` +
      `Siz Sweet CANDY platformasida shirinliklaringizni sotishingiz, yangi buyurtmalarni qabul qilishingiz va do‘koningizni boshqarishingiz mumkin.\n\n` +
      `📌 *Xabarnomalarni yoqish:*\n` +
      `Do‘koningizga yangi buyurtma kelganda Telegram-ga bildirishnoma olish uchun do‘kon panelidagi *Telegram bot xabarnomalari* bo‘limidan ulaning.`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '📊 Sotuvchi Boshqaruv Paneli', web_app: { url: `${webAppUrl}/seller/dashboard` } },
        ],
        [
          { text: '➕ Yangi shirinlik qo‘shish', web_app: { url: `${webAppUrl}/seller/products/new` } },
          { text: '📦 Jami buyurtmalar', web_app: { url: `${webAppUrl}/seller/orders` } },
        ],
        [
          { text: '🔗 Telegram xabarnomani ulash', web_app: { url: `${webAppUrl}/seller/telegram` } },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, text, inlineMarkup);
    await this.sendMessageWithMarkup(
      token,
      chatId,
      'Qandolatchi kabineti (4 ta tugma) 👇',
      this.getSellerKeyboard(webAppUrl)
    );
  }

  /**
   * Sends help & contact info
   */
  private static async sendHelpMessage(token: string, chatId: number) {
    const webAppUrl = this.getWebAppBaseUrl();

    const text =
      `ℹ️ *Sweet CANDY haqida va Yordam*\n\n` +
      `Sweet CANDY — uy qandolatchilari, shirinlik ustalari va shirinlik ixlosmandlarini birlashtiruvchi zamonaviy platforma.\n\n` +
      `🧁 *Qanday buyurtma beriladi?*\n` +
      `1. "Saytni ochish" tugmasini bosing\n` +
      `2. O‘zingizga yoqqan shirinlikni savatchaga qo‘shing\n` +
      `3. Yetkazib berish sanasi va manzilini kiritib buyurtmani tasdiqlang\n` +
      `4. Qandolatchi buyurtmangizni qabul qiladi va tayyorlaydi!\n\n` +
      `📞 *Aloqa & Qo‘llab-quvvatlash:*\n` +
      `Telefon: +998 71 200 00 00\n` +
      `Sayt: ${webAppUrl}`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 Saytni ochish (Web App)', web_app: { url: webAppUrl } },
          { text: '🔐 Login (Kirish)', web_app: { url: `${webAppUrl}/login` } },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, text, inlineMarkup);
    await this.sendMessageWithMarkup(
      token,
      chatId,
      'Sayt va yordam tugmalari (4 ta tugma) 👇',
      this.getSiteLoginKeyboard(webAppUrl)
    );
  }

  /**
   * Helper to send plain text with optional inline markup
   */
  private static async sendMessage(token: string, chatId: number, text: string, replyMarkup?: any) {
    return this.sendMessageWithMarkup(token, chatId, text, replyMarkup);
  }

  private static async sendMessageWithMarkup(token: string, chatId: number, text: string, replyMarkup?: any) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn(`[Telegram Bot] sendMessage error (${data.error_code}): ${data.description}`);
        // Retry without parse_mode in case dynamic characters broke Markdown entity parsing
        if (String(data.description || '').includes('parse entities')) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: text.replace(/[*_`]/g, ''),
              reply_markup: replyMarkup,
            }),
          });
        }
      }
    } catch (err: any) {
      console.error(`Error sending message to chat ${chatId}:`, err.message);
    }
  }

  /**
   * Helper to send photo with caption & inline buttons
   */
  private static async sendPhoto(token: string, chatId: number, photoUrl: string, caption: string, replyMarkup?: any) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        // Fallback to text message if photo fails to load
        await this.sendMessageWithMarkup(token, chatId, caption, replyMarkup);
      }
    } catch (err: any) {
      await this.sendMessageWithMarkup(token, chatId, caption, replyMarkup);
    }
  }

  /**
   * Stops polling
   */
  static stop() {
    this.isRunning = false;
    this.pollingAbortController?.abort();
  }
}
