import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { TelegramService } from './telegram.service';

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
   * Initializes and starts the Telegram Bot polling loop
   */
  static async start(): Promise<void> {
    const token = env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log('----------------------------------------------------');
      console.log('🤖 [Telegram Bot] TELEGRAM_BOT_TOKEN sozlanmagan.');
      console.log('ℹ️ Botni faollashtirish uchun .env faylida TELEGRAM_BOT_TOKEN ni kiriting.');
      console.log('ℹ️ Bot tokeningizni Telegram-dagi @BotFather orqali olishingiz mumkin.');
      console.log('----------------------------------------------------');
      return;
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.pollingAbortController = new AbortController();

    try {
      // 1. Verify Bot Token & Get Bot Info
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();

      if (!meData.ok) {
        console.error('❌ [Telegram Bot] Token noto‘g‘ri yoki Telegram API ulanmadi:', meData.description);
        this.isRunning = false;
        return;
      }

      const botUser = meData.result;
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
   * Registers default slash commands
   */
  private static async setupCommands(token: string) {
    try {
      const commands = [
        { command: 'start', description: 'Bosh menyu / Botni ishga tushirish' },
        { command: 'app', description: 'Sweet CANDY ilovasini ochish (Web App)' },
        { command: 'menu', description: 'Shirinliklar katalogi va narxlar' },
        { command: 'orders', description: 'Mening buyurtmalarim' },
        { command: 'seller', description: 'Qandolatchi / Sotuvchi kabineti' },
        { command: 'help', description: 'Yordam va ma’lumot' },
      ];

      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
    } catch (err: any) {
      console.warn('Telegram setMyCommands warning:', err.message);
    }
  }

  /**
   * Sets the permanent Web App button in the Telegram chat input
   */
  private static async setupMenuButton(token: string) {
    try {
      const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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
   * Dispatches incoming Telegram updates
   */
  private static async handleUpdate(token: string, update: TelegramUpdate) {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text?.trim() || '';

      // 1. Deep linking start command: /start <token>
      if (text.startsWith('/start ')) {
        const connToken = text.replace('/start ', '').trim();
        const res = await TelegramService.handleTelegramStartCommand(chatId, connToken);
        if (res.success) {
          await this.sendMessage(token, chatId, `🎉 *Tabriklaymiz!*\n\nSizning *"${res.sellerName}"* do'koningiz muvaffaqiyatli ulandi!\nEndi xaridorlar shirinliklaringizga buyurtma berganda darhol shu yerga xabarnoma keladi.`);
        } else {
          await this.sendMessage(token, chatId, `⚠️ *Xatolik:* ${res.message}\n\nQaytadan ulash uchun do‘kon boshqaruv panelingizdan yangi token oling.`);
        }
        return;
      }

      // 2. Standard /start command
      if (text === '/start') {
        await this.sendWelcomeMessage(token, chatId, msg.from.first_name);
        return;
      }

      // 3. Web App /app command
      if (text === '/app' || text.toLowerCase().includes('ilovani ochish') || text.toLowerCase().includes('shirinliklar do\'koni')) {
        await this.sendWebAppButton(token, chatId);
        return;
      }

      // 4. Products menu: /menu or "🍰 Shirinliklar menyusi"
      if (text === '/menu' || text.includes('Shirinliklar') || text.includes('shirinliklar')) {
        await this.sendProductsCatalog(token, chatId);
        return;
      }

      // 5. My orders: /orders or "📦 Buyurtmalarim"
      if (text === '/orders' || text.includes('Buyurtmalar') || text.includes('buyurtmalar')) {
        await this.sendMyOrders(token, chatId);
        return;
      }

      // 6. Seller dashboard: /seller or "👨‍🍳 Qandolatchi kabineti"
      if (text === '/seller' || text.includes('Qandolatchi') || text.includes('Sotuvchi')) {
        await this.sendSellerMenu(token, chatId);
        return;
      }

      // 7. Help & About: /help or "ℹ️ Biz haqimizda & Yordam"
      if (text === '/help' || text.includes('haqimizda') || text.includes('Yordam')) {
        await this.sendHelpMessage(token, chatId);
        return;
      }

      // Default fallback
      await this.sendWelcomeMessage(token, chatId, msg.from.first_name);
    } else if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat.id;
      const data = cb.data;

      if (!chatId || !data) return;

      // Answer callback query to dismiss loader in Telegram client
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });

      if (data === 'open_menu') {
        await this.sendProductsCatalog(token, chatId);
      } else if (data === 'open_help') {
        await this.sendHelpMessage(token, chatId);
      }
    }
  }

  /**
   * Sends the primary Sweet CANDY welcome message with ReplyKeyboard
   */
  private static async sendWelcomeMessage(token: string, chatId: number, firstName: string) {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const welcomeText =
      `🍭 *Sweet CANDY — Shirinliklar va Tortlar do‘koni*\n\n` +
      `Assalomu alaykum, *${firstName}*! Sweet CANDY rasmiy Telegram botiga xush kelibsiz.\n\n` +
      `Bu yerda eng sara shirinliklar, to'rtlar, desertlar va pishiriqlarni onlayn ko‘rishingiz, tanlashingiz va to‘g‘ridan-to‘g‘ri buyurtma qilishingiz mumkin!\n\n` +
      `👇 Buyurtma berish uchun quyidagi tugmalardan foydalaning:`;

    const replyMarkup = {
      keyboard: [
        [
          { text: '🧁 Ilovani ochish (Web App)', web_app: { url: webAppUrl } },
        ],
        [
          { text: '🍰 Shirinliklar menyusi' },
          { text: '📦 Buyurtmalarim' },
        ],
        [
          { text: '👨‍🍳 Qandolatchi kabineti' },
          { text: 'ℹ️ Biz haqimizda & Yordam' },
        ],
      ],
      resize_keyboard: true,
      persistent: true,
    };

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 Ilovani ochish (Web App)', web_app: { url: webAppUrl } },
        ],
        [
          { text: '🍰 Shirinliklar katalogi', callback_data: 'open_menu' },
          { text: 'ℹ️ Yordam', callback_data: 'open_help' },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, welcomeText, inlineMarkup);
    // Also deliver reply keyboard for bottom persistent buttons
    await this.sendMessageWithMarkup(token, chatId, 'Boshqaruv tugmalari pastki menyuda faollashtirildi 👇', replyMarkup);
  }

  /**
   * Sends direct Web App link button
   */
  private static async sendWebAppButton(token: string, chatId: number) {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const text =
      `🧁 *Sweet CANDY Ilovasi*\n\n` +
      `Sweet CANDY to‘liq onlayn ilovasini ochish va buyurtma berish uchun quyidagi tugmani bosing:`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 Ilovani ochish (Web App)', web_app: { url: webAppUrl } },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, text, inlineMarkup);
  }

  /**
   * Sends products catalog directly in Telegram chat with photos & ordering buttons
   */
  private static async sendProductsCatalog(token: string, chatId: number) {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
        take: 6,
      });

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
        return;
      }

      await this.sendMessage(token, chatId, `✨ *Eng sara shirinliklarimiz:* \nQuyidagi har bir shirinlikka shu yerdan turib buyurtma bera olasiz:`);

      for (const prod of products) {
        const imageUrl = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
        const formattedPrice = Number(prod.price).toLocaleString('ru-RU');
        const prepTime = prod.preparationTimeHours ? `${prod.preparationTimeHours} soat` : 'Darhol';

        const caption =
          `🍰 *${prod.name}*\n` +
          `💰 *Narxi:* ${formattedPrice} UZS\n` +
          `⏱️ *Tayyorlanish vaqti:* ${prepTime}\n` +
          `🏪 *Qandolatchi:* ${prod.seller.storeName}\n` +
          (prod.description ? `📝 ${prod.description.substring(0, 120)}...\n` : '');

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

      await this.sendMessage(
        token,
        chatId,
        `🍰 *Yana boshqa barcha shirinliklar, to'rtlar va desertlarni ko'rish uchun ilovani oching:*`,
        {
          inline_keyboard: [
            [{ text: '🧁 Barcha shirinliklarni ko‘rish (Web App)', web_app: { url: `${webAppUrl}/explore` } }],
          ],
        }
      );
    } catch (err: any) {
      console.error('Error fetching products for Telegram bot:', err);
      await this.sendMessage(token, chatId, `Xatolik yuz berdi. Iltimos, ilovani oching: ${webAppUrl}`);
    }
  }

  /**
   * Sends user orders view
   */
  private static async sendMyOrders(token: string, chatId: number) {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
  }

  /**
   * Sends seller / confectioner dashboard options
   */
  private static async sendSellerMenu(token: string, chatId: number) {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
  }

  /**
   * Sends help & contact info
   */
  private static async sendHelpMessage(token: string, chatId: number) {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const text =
      `ℹ️ *Sweet CANDY haqida va Yordam*\n\n` +
      `Sweet CANDY — uy qandolatchilari, shirinlik ustalari va shirinlik ixlosmandlarini birlashtiruvchi zamonaviy platforma.\n\n` +
      `🧁 *Qanday buyurtma beriladi?*\n` +
      `1. "Ilovani ochish" tugmasini bosing\n` +
      `2. O‘zingizga yoqqan shirinlikni savatchaga qo‘shing\n` +
      `3. Yetkazib berish sanasi va manzilini kiritib buyurtmani tasdiqlang\n` +
      `4. Qandolatchi buyurtmangizni qabul qiladi va tayyorlaydi!\n\n` +
      `📞 *Aloqa & Qo‘llab-quvvatlash:*\n` +
      `Telefon: +998 71 200 00 00\n` +
      `Sayt: ${webAppUrl}`;

    const inlineMarkup = {
      inline_keyboard: [
        [
          { text: '🚀 Ilovani ochish (Web App)', web_app: { url: webAppUrl } },
        ],
      ],
    };

    await this.sendMessageWithMarkup(token, chatId, text, inlineMarkup);
  }

  /**
   * Helper to send plain text with optional inline markup
   */
  private static async sendMessage(token: string, chatId: number, text: string, replyMarkup?: any) {
    return this.sendMessageWithMarkup(token, chatId, text, replyMarkup);
  }

  private static async sendMessageWithMarkup(token: string, chatId: number, text: string, replyMarkup?: any) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
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
