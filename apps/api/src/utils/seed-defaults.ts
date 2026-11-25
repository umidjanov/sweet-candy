import { PrismaClient } from '@prisma/client';

/**
 * Seeds base categories, subcategories, and platform settings idempotently.
 * Shared between CLI seed script and serverless cold-start auto-initialization.
 */
export async function seedCategoriesAndSettings(prisma: PrismaClient) {
  const rootCategories = [
    {
      name: 'Cakes',
      slug: 'cakes',
      description: 'Artisanal, birthday, wedding, and handcrafted custom cakes',
      imageUrl: 'https://foodnouveau.com/wp-content/uploads/2016/09/Angel-Food-Cake_02_1290px.jpg',
      subcategories: [
        {
          name: 'Birthday Cakes',
          slug: 'birthday-cakes',
          description: 'Fun and celebratory birthday cakes',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxdg9Kz0tI3t5xfzWjMq_Io-vkKP87vshoZ1LvIfT_8RWF-e_m9MKCzsg&s=10',
        },
        {
          name: 'Wedding Cakes',
          slug: 'wedding-cakes',
          description: 'Elegant layered wedding centerpieces',
          imageUrl: 'https://www.angesdesucre.com/cdn/shop/files/Ivory_Flourish_Wedding_Cake_London_Surrey.jpg?v=1778693106&width=1920',
        },
        { name: 'Chocolate Cakes', slug: 'chocolate-cakes', description: 'Rich fudge, ganache, and dark chocolate delights' },
        {
          name: 'Fruit Cakes',
          slug: 'fruit-cakes',
          description: 'Fresh berries, citrus, and seasonal fruit cakes',
          imageUrl: 'https://www.bakinglikeachef.com/wp-content/uploads/fresh-fruit-cake.jpg',
        },
        {
          name: 'Custom Cakes',
          slug: 'custom-cakes',
          description: 'Personalized designs, toppers, and photo cakes',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9kDdmtk7ESyAHzAHWJ6D8W3r-yR0VmFvbjlSBRGRl6XtS7FWPciBpdHYx&s=10',
        },
      ],
    },
    {
      name: 'Sweets',
      slug: 'sweets',
      description: 'Cupcakes, macarons, cookies, donuts and sweet bites',
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
      subcategories: [
        {
          name: 'Cupcakes',
          slug: 'cupcakes',
          description: 'Swirled frosting on moist miniature cakes',
          imageUrl: 'https://www.ifyougiveablondeakitchen.com/wp-content/uploads/2025/01/funfetti-cupcakes-from-scratch.jpg',
        },
        {
          name: 'Cookies',
          slug: 'cookies',
          description: 'Crisp & chewy artisan cookies',
          imageUrl: 'https://bakingwithbutter.com/wp-content/uploads/2024/11/egg-white-cookies-5-1-500x500.jpg',
        },
        {
          name: 'Brownies',
          slug: 'brownies',
          description: 'Fudgy chocolate squares and blondies',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhW9nNn_8iPm6pxyzWQrFZbytSRViAWETN_o-UbrsTaZYXcDjtXY7mT8A&s=10',
        },
        {
          name: 'Cheesecakes',
          slug: 'cheesecakes',
          description: 'New York style, Basque, and fruit swirl cheesecakes',
          imageUrl: 'https://www.lifeloveandsugar.com/wp-content/uploads/2023/12/No-Bake-Chocolate-Cheesecake3.jpg',
        },
        {
          name: 'Donuts',
          slug: 'donuts',
          description: 'Glazed, filled, and ring donuts',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIzsheXABAftgOWQ_S8ZzsQ-Bmq440Wm78mY4G1E_VTkMTU8eQV4myZP5T&s=10',
        },
        {
          name: 'Macarons',
          slug: 'macarons',
          description: 'Delicate Parisian almond meringue shells',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpVxusLm6ogX7gIeWmLbNgDmNFTr0OYDo9moZcg8L-96dJNB1RObhqcVM&s=10',
        },
        {
          name: 'Waffles',
          slug: 'waffles',
          description: 'Belgian waffles with berries and syrups',
          imageUrl: 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480_1_5x/img/recipe/ras/Assets/b093fb7f90b3d25f5674209bb849fc17/Derivates/538d257ef5719ff8c548c0b5897e3465d3703408.jpg',
        },
        {
          name: 'Traditional Sweets',
          slug: 'traditional-sweets',
          description: 'Baklava, Chak-chak, Navat, and regional specialties',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjXpnixWzdXOU-RNFpJW5IuwEDvHSMd72r4X5ZxJii7gPmCZIYWE4MNmmC&s=10',
        },
      ],
    },
    {
      name: 'Desserts',
      slug: 'desserts',
      description: 'Tiramisu, puddings, dessert boxes, and chilled delights',
      imageUrl: 'https://images.immediate.co.uk/production/volatile/sites/2/2025/10/Quick-desserts--a9674d4.jpg?resize=1366,1503',
      subcategories: [
        {
          name: 'Tiramisu',
          slug: 'tiramisu',
          description: 'Italian coffee-soaked ladyfingers & mascarpone',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMxzrsZpsQpUkEpwNYFG4ZGylh0PqmeHmbTa8t5FnLl0yDclrBjI-JBM8&s=10',
        },
        {
          name: 'Puddings',
          slug: 'puddings',
          description: 'Silky custards, chia bowls, and parfaits',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTerRpGn2coJSdqDaUM5yHvzIGUL5W_j5L8xneVvOVXelHONHZUrwt4VGA&s=10',
        },
        {
          name: 'Ice Cream & Sorbets',
          slug: 'ice-cream',
          description: 'Homemade gelato, craft ice cream, and fruit sorbets',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcuaGkWRDBU2UhT2tg0jrNp0dvRGqM6kKRMhQGgS6r5nzCqVy3Ky_lcQaK&s=10',
        },
        {
          name: 'Dessert Boxes',
          slug: 'dessert-boxes',
          description: 'Curated gift boxes with assorted confectionery',
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmiM27ZlyaAZQy8TW3zCOdY0QL_xYwOrXWG0bC20sLTmeE_HP_5VDNPx4&s=10',
        },
      ],
    },
    {
      name: 'Other Food',
      slug: 'other-food',
      description: 'Savoury pastries, homemade jams, syrups, and specialty snacks',
      imageUrl: 'https://storage.kun.uz/source/11/9b2gVd4uHWJs0-FFQ75_GcpgElkvfVSQ.jpg',
      subcategories: [],
    },
  ];

  let displayOrder = 1;
  for (const root of rootCategories) {
    const parent = await prisma.category.upsert({
      where: { slug: root.slug },
      update: {
        name: root.name,
        description: root.description,
        imageUrl: root.imageUrl,
        displayOrder: displayOrder++,
      },
      create: {
        name: root.name,
        slug: root.slug,
        description: root.description,
        imageUrl: root.imageUrl,
        displayOrder: displayOrder++,
      },
    });

    for (const sub of root.subcategories as Array<{ name: string; slug: string; description: string; imageUrl?: string }>) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          description: sub.description,
          ...(sub.imageUrl ? { imageUrl: sub.imageUrl } : {}),
          parentId: parent.id,
          displayOrder: displayOrder++,
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          imageUrl: sub.imageUrl || null,
          parentId: parent.id,
          displayOrder: displayOrder++,
        },
      });
    }
  }

  const defaultSettings = [
    { key: 'platform_name', value: { name: 'SweetMarket', tagline: 'Homemade Sweets Made With Love' } },
    { key: 'currency', value: { code: 'UZS', symbol: "so'm", decimals: 0 } },
    { key: 'commission_rate', value: { percent: 0 } },
    { key: 'seller_auto_approval', value: { enabled: false } },
    { key: 'contact_info', value: { support_phone: '+998 71 200 00 00', support_email: 'support@sweetmarket.uz' } },
  ];

  for (const s of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
}

