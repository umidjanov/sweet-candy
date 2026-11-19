import { prisma } from '../config/database';

export class CategoryService {
  static async getAllCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  static async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        products: {
          where: {
            isHiddenByAdmin: false,
            seller: {
              approvalStatus: 'APPROVED',
              user: { status: 'ACTIVE' },
            },
          },
          include: {
            images: { orderBy: { displayOrder: 'asc' } },
            seller: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  static async createCategory(data: any) {
    return prisma.category.create({ data });
  }

  static async updateCategory(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id: string) {
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw new Error('Cannot delete category with associated products.');
    }
    return prisma.category.delete({ where: { id } });
  }
}

