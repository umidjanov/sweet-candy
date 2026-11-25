import { describe, it, expect, vi } from 'vitest';
import { generateOrderNumber } from '../src/utils/order-number';
import { createProductSchema } from '../src/validators/product.validator';
import { createOrderSchema } from '../src/validators/order.validator';
import { TelegramService } from '../src/integrations/telegram/telegram.service';
import { TelegramBotRunner } from '../src/integrations/telegram/telegram-bot.runner';
import { TelegramController } from '../src/controllers/telegram.controller';
import { prisma } from '../src/config/database';

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
});
