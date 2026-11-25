import { describe, it, expect, vi } from 'vitest';
import { generateOrderNumber } from '../src/utils/order-number';
import { createProductSchema } from '../src/validators/product.validator';
import { createOrderSchema, updateOrderStatusSchema } from '../src/validators/order.validator';
import { TelegramService } from '../src/integrations/telegram/telegram.service';
import { TelegramBotRunner } from '../src/integrations/telegram/telegram-bot.runner';
import { TelegramController } from '../src/controllers/telegram.controller';
import { OrderService } from '../src/services/order.service';
import { prisma } from '../src/config/database';
import '../src/utils/response';

describe('SweetMarket Product, Order & Telegram Tests', () => {
  it('should generate properly formatted order numbers (SM-YYMM-XXXX)', () => {
    const num1 = generateOrderNumber();
    const num2 = generateOrderNumber();

    expect(num1).toMatch(/^SM-\d{4}-\d{4}$/);
    expect(num2).toMatch(/^SM-\d{4}-\d{4}$/);
    expect(num1).not.toBe(num2);
  });

  it('should validate dessert product creation schema', () => {
    const validProduct = createProductSchema.safeParse({
      name: 'Pistachio Raspberry Macaron Tower',
      categoryId: 'a0000000-0000-0000-0000-000000000001',
      description: 'Handcrafted French macarons with Sicilian pistachio ganache and raspberry puree.',
      price: 185000,
      currency: 'UZS',
      preparationTimeHours: 6,
      portionSize: '24 macarons',
      ingredients: [
        { name: 'Almond flour', isAllergen: true },
        { name: 'Pistachio paste', isAllergen: true },
        { name: 'Raspberries', isAllergen: false },
        { name: 'Egg whites', isAllergen: true },
      ],
      imageUrls: ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35'],
    });

    expect(validProduct.success).toBe(true);

    const invalidPrice = createProductSchema.safeParse({
      name: 'Invalid Price Cake',
      categoryId: 'a0000000-0000-0000-0000-000000000001',
      description: 'Too short',
      price: -500, // Negative price invalid
    });
    expect(invalidPrice.success).toBe(false);
  });

  it('should validate order creation requirements (delivery address mandatory for DELIVERY)', () => {
    // Delivery without address -> invalid
    const invalidDelivery = createOrderSchema.safeParse({
      sellerId: 'a0000000-0000-0000-0000-000000000002',
      items: [{ productId: 'a0000000-0000-0000-0000-000000000003', quantity: 2 }],
      requestedDate: '2026-12-25',
      requestedTime: '15:00',
      deliveryType: 'DELIVERY',
      deliveryAddress: '', // Empty address should fail
      customerName: 'Aziz Rakhimov',
      customerPhone: '+998901234567',
    });
    expect(invalidDelivery.success).toBe(false);

    // Valid pickup order without delivery address -> passes
    const validPickup = createOrderSchema.safeParse({
      sellerId: 'a0000000-0000-0000-0000-000000000002',
      items: [{ productId: 'a0000000-0000-0000-0000-000000000003', quantity: 1 }],
      requestedDate: '2026-12-25',
      requestedTime: '14:00',
      deliveryType: 'PICKUP',
      customerName: 'Aziz Rakhimov',
      customerPhone: '+998901234567',
    });
    expect(validPickup.success).toBe(true);
  });

  it('should handle Telegram /start token validation safely with mocked DB', async () => {
    vi.spyOn(prisma.telegramConnection, 'findUnique').mockResolvedValue(null as any);

    const result = await TelegramService.handleTelegramStartCommand(12345678, 'test-nonexistent-token');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid or unrecognized');
  });

  it('should dispatch webhook updates through TelegramBotRunner in serverless webhook handler', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:TEST_TOKEN';
    const handleSpy = vi.spyOn(TelegramBotRunner, 'handleUpdate').mockResolvedValue(undefined);

    const jsonMock = vi.fn();
    const res = { status: vi.fn().mockReturnValue({ json: jsonMock }) } as any;
    const req = {
      body: {
        update_id: 999,
        message: { message_id: 1, chat: { id: 42 }, from: { id: 42, is_bot: false, first_name: 'Ali' }, date: 1, text: '/start' },
      },
    } as any;

    await TelegramController.handleWebhook(req, res, vi.fn());

    expect(handleSpy).toHaveBeenCalledWith('123456:TEST_TOKEN', req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ ok: true });
    handleSpy.mockRestore();
  });

  it('should send complete bot overview and escape special Markdown chars on /start', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ ok: true }),
    } as any);

    await TelegramBotRunner.handleUpdate('123456:TEST_TOKEN', {
      update_id: 1000,
      message: {
        message_id: 2,
        chat: { id: 777, type: 'private' },
        from: { id: 777, is_bot: false, first_name: 'Fayzulloh_Dev' },
        date: 1,
        text: '/start@sweet_candy_uz_bot',
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const firstCallBody = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(firstCallBody.text).toContain('Fayzulloh\\_Dev');
    expect(firstCallBody.text).toContain('Bot haqida ma’lumot va bo‘limlar');
    expect(firstCallBody.reply_markup.inline_keyboard[0][0].web_app.url).toMatch(/^https:\/\//);
    expect(firstCallBody.reply_markup.inline_keyboard[0][1].web_app.url).toMatch(/\/login$/);

    const secondCallBody = JSON.parse((fetchSpy.mock.calls[1][1] as any).body);
    expect(secondCallBody.reply_markup.is_persistent).toBe(true);
    const mainButtonCount = secondCallBody.reply_markup.keyboard.flat().length;
    expect(mainButtonCount).toBe(5);
    fetchSpy.mockRestore();
  });

  it('should switch to 4 contextual buttons in Prices/Products and return to 5 buttons on Ortga qaytish', async () => {
    const prodSpy = vi.spyOn(prisma.product, 'findMany').mockResolvedValue([
      {
        id: 'p-1',
        name: 'Shokoladli tort',
        price: 250000,
        currency: 'UZS',
        preparationTimeHours: 4,
        description: 'Mazali tort',
        seller: { storeName: 'SweetHome' },
        category: { name: 'Cakes' },
        images: [],
      } as any,
    ]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ ok: true }),
    } as any);

    await TelegramBotRunner.handleUpdate('123456:TEST_TOKEN', {
      update_id: 1001,
      message: {
        message_id: 3,
        chat: { id: 777, type: 'private' },
        from: { id: 777, is_bot: false, first_name: 'Ali' },
        date: 1,
        text: '💰 Narxlar',
      },
    });

    const priceBody = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(priceBody.text).toContain('Shokoladli tort');
    expect(priceBody.text).toContain('250');

    const priceKbBody = JSON.parse((fetchSpy.mock.calls[1][1] as any).body);
    const priceButtons = priceKbBody.reply_markup.keyboard.flat();
    expect(priceButtons).toHaveLength(4);
    expect(priceButtons.some((b: any) => b.text.includes('Ortga qaytish'))).toBe(true);

    fetchSpy.mockClear();

    await TelegramBotRunner.handleUpdate('123456:TEST_TOKEN', {
      update_id: 1002,
      message: {
        message_id: 4,
        chat: { id: 777, type: 'private' },
        from: { id: 777, is_bot: false, first_name: 'Ali' },
        date: 1,
        text: '⬅️ Ortga qaytish',
      },
    });

    const backKbBody = JSON.parse((fetchSpy.mock.calls[1][1] as any).body);
    expect(backKbBody.reply_markup.keyboard.flat()).toHaveLength(5);

    prodSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('should send seller notification with Qabul qilish button and accept order on callback', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '123456:TEST_TOKEN';

    const orderSpy = vi.spyOn(prisma.order, 'findUnique').mockResolvedValue({
      id: 'ord-1',
      orderNumber: 'SM-2611-0001',
      sellerId: 'sel-1',
      customerName: 'Dilnoza_K',
      customerPhone: '+998901112233',
      requestedDate: new Date('2026-12-01'),
      requestedTime: '14:00 - 16:00',
      deliveryType: 'DELIVERY',
      deliveryAddress: 'Chilonzor 5',
      total: 275000,
      currency: 'UZS',
      customerMessage: null,
      items: [{ productNameSnapshot: 'napalion', quantity: 1, lineTotal: 250000 }],
      seller: {
        id: 'sel-1',
        userId: 'user-sel-1',
        telegramConnected: true,
        telegramChatId: BigInt(555000),
      },
    } as any);
    const notifFindSpy = vi.spyOn(prisma.telegramNotification, 'findFirst').mockResolvedValue(null);
    const notifCreateSpy = vi.spyOn(prisma.telegramNotification, 'create').mockResolvedValue({ id: 'log-1' } as any);
    const notifUpdateSpy = vi.spyOn(prisma.telegramNotification, 'update').mockResolvedValue({ id: 'log-1' } as any);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ ok: true }),
    } as any);

    const notifyRes = await TelegramService.sendOrderNotification('ord-1');
    expect(notifyRes.delivered).toBe(true);

    const sendBody = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(sendBody.text).toContain('SIZGA YANGI BUYURTMA KELDI');
    expect(sendBody.text).toContain('Dilnoza\\_K');
    expect(sendBody.reply_markup.inline_keyboard[0][0].text).toContain('Qabul qilish');
    expect(sendBody.reply_markup.inline_keyboard[0][0].callback_data).toBe('order_accept:ord-1');
    expect(sendBody.reply_markup.inline_keyboard[0][1].callback_data).toBe('order_reject:ord-1');

    fetchSpy.mockClear();
    const updateStatusSpy = vi.spyOn(OrderService, 'updateOrderStatus').mockResolvedValue({ id: 'ord-1', status: 'ACCEPTED' } as any);

    await TelegramBotRunner.handleUpdate('123456:TEST_TOKEN', {
      update_id: 2001,
      callback_query: {
        id: 'cb-1',
        from: { id: 555000, first_name: 'Baker' },
        message: { message_id: 88, chat: { id: 555000 } },
        data: 'order_accept:ord-1',
      },
    });

    expect(updateStatusSpy).toHaveBeenCalledWith(
      'ord-1',
      'ACCEPTED',
      'user-sel-1',
      'sel-1',
      false,
      { sellerNotes: 'Telegram bot orqali qabul qilindi' }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(3); // answerCallbackQuery + editMessageReplyMarkup + confirmation sendMessage

    orderSpy.mockRestore();
    notifFindSpy.mockRestore();
    notifCreateSpy.mockRestore();
    notifUpdateSpy.mockRestore();
    updateStatusSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('should serialize BigInt values safely in JSON responses', () => {
    const payload = {
      user: {
        id: 'u-1',
        sellerProfile: {
          id: 'sel-1',
          telegramChatId: BigInt('7189234567'),
        },
      },
    };
    expect(() => JSON.stringify(payload)).not.toThrow();
    expect(JSON.parse(JSON.stringify(payload)).user.sellerProfile.telegramChatId).toBe('7189234567');
  });

  it('should generate and verify compact customer Telegram link tokens (<= 64 chars)', () => {
    const userId = 'a0000000-0000-0000-0000-000000000123';
    const { token, botUrl } = TelegramService.generateCustomerLinkToken(userId);
    expect(token.length).toBeLessThanOrEqual(64);
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    expect(botUrl).toContain(`?start=${token}`);
    expect(TelegramService.verifyCustomerLinkToken(token)).toBe(userId);
  });

  it('should enforce READY permission before OUT_FOR_DELIVERY and send Yandex link to customer Telegram', async () => {
    expect(
      updateOrderStatusSchema.safeParse({
        status: 'OUT_FOR_DELIVERY',
        trackingUrl: 'https://go.yandex/track/12345',
      }).success
    ).toBe(true);

    // 1. Block OUT_FOR_DELIVERY when order is still PREPARING
    const preparingFindSpy = vi.spyOn(prisma.order, 'findUnique').mockResolvedValueOnce({
      id: 'ord-2',
      orderNumber: 'SM-2611-2222',
      sellerId: 'sel-1',
      status: 'PREPARING',
      seller: { id: 'sel-1', storeName: "Azizov's Cakes" },
    } as any);

    await expect(
      OrderService.updateOrderStatus('ord-2', 'OUT_FOR_DELIVERY', 'user-sel-1', 'sel-1', false, {
        trackingUrl: 'https://go.yandex/track/12345',
      })
    ).rejects.toThrow(/Tayyor/i);
    preparingFindSpy.mockRestore();

    // 2. Allow OUT_FOR_DELIVERY when READY + valid Yandex URL and notify customer on Telegram
    process.env.TELEGRAM_BOT_TOKEN = '123456:TEST_TOKEN';
    const readyFindSpy = vi
      .spyOn(prisma.order, 'findUnique')
      .mockResolvedValueOnce({
        id: 'ord-3',
        orderNumber: 'SM-2611-3333',
        sellerId: 'sel-1',
        customerId: 'cust-1',
        status: 'READY',
        dispatchedAt: null,
        seller: { id: 'sel-1', storeName: "Azizov's Cakes" },
      } as any)
      .mockResolvedValueOnce({
        id: 'ord-3',
        orderNumber: 'SM-2611-3333',
        customerName: 'Dilnoza',
        deliveryType: 'DELIVERY',
        trackingUrl: 'https://go.yandex/track/999',
        customer: { id: 'cust-1', firstName: 'Dilnoza', telegramChatId: BigInt(888777666) },
        seller: { id: 'sel-1', storeName: "Azizov's Cakes", publicPhone: '+998901234567' },
      } as any);

    const txSpy = vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (cb: any) =>
      cb({
        order: {
          update: vi.fn().mockResolvedValue({
            id: 'ord-3',
            orderNumber: 'SM-2611-3333',
            customerId: 'cust-1',
            status: 'OUT_FOR_DELIVERY',
            trackingUrl: 'https://go.yandex/track/999',
          }),
        },
        notification: { create: vi.fn().mockResolvedValue({ id: 'n-1' }) },
      })
    );

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ ok: true }),
    } as any);

    const res: any = await OrderService.updateOrderStatus(
      'ord-3',
      'OUT_FOR_DELIVERY',
      'user-sel-1',
      'sel-1',
      false,
      { trackingUrl: 'https://go.yandex/track/999' }
    );

    expect(res.status).toBe('OUT_FOR_DELIVERY');
    expect(res.trackingUrl).toBe('https://go.yandex/track/999');
    expect(res.telegramNotification.delivered).toBe(true);

    const tgBody = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(tgBody.chat_id).toBe('888777666');
    expect(tgBody.text).toContain('tez orada keladi');
    expect(tgBody.text).toContain('https://go.yandex/track/999');
    expect(tgBody.reply_markup.inline_keyboard[0][0].url).toBe('https://go.yandex/track/999');

    readyFindSpy.mockRestore();
    txSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
