import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CategoryDto } from './dto';

@Injectable()
export class CategoryService {
  private queryOptions = {};

  constructor(private prisma: PrismaService) {}

  async create(payload: CategoryDto) {
    try {
      let categoryCreated: any;
      const { name } = payload;

      if (!name) throw new BadRequestException('Name is required');

      if (Array.isArray(name)) {
        categoryCreated = await this.createMany(name);
      } else {
        if (!name) throw new BadRequestException('Name is required');
        categoryCreated = await this.prisma.category.create({
          data: {
            name,
            slug: name.toLowerCase().replace(/ /g, '-') as string,
          },
        });
      }

      return this.response(
        { category: categoryCreated },
        'Category created successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  private createMany(names: string[]) {
    const payloadWithSlug = names.map((name) => ({
      name,
      slug: name.toLowerCase().replace(/ /g, '-') as string,
    }));

    return this.prisma.category.createMany({
      data: payloadWithSlug,
      skipDuplicates: true,
    });
  }

  async getAll(query: any = {}) {
    const { name, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const skipTake =
      limit === '*' ? undefined : { skip: Number(offset), take: Number(limit) };

    this.searchByName(name);

    const [categories, count] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        ...skipTake,
        where: {
          ...this.queryOptions,
        },
        ...this.sortBy(query.sort),
      }),
      this.prisma.category.count({
        where: {
          ...this.queryOptions,
        },
      }),
    ]);

    const meta = {
      ...(await this.prisma.paginate({
        count,
        page,
        limit,
      })),
      total_data_per_page: categories.length,
    };

    this.queryOptions = {};

    return this.response(
      { categories },
      'Categories retrieved successfully',
      meta,
    );
  }

  async getOne(idOrSlug: number | string) {
    const category = isNaN(Number(idOrSlug))
      ? await this.getOneBySlug(idOrSlug as string)
      : await this.getOneById(Number(idOrSlug));

    return this.response({ category }, 'Category retrieved successfully');
  }

  private async getOneById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException('Record not found');
    }

    return category;
  }

  private async getOneBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        slug,
      },
    });

    if (!category) {
      throw new NotFoundException('Record not found');
    }

    return category;
  }

  async update(id: number, payload: { name: string }) {
    try {
      const { name } = payload;
      await this.prisma.category.update({
        where: {
          id,
        },
        data: {
          name,
          slug: name.toLowerCase().replace(/ /g, '-') as string,
        },
      });

      return this.response(
        { category_id: id },
        'Category updated successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number) {
    try {
      await this.prisma.category.delete({
        where: {
          id,
        },
      });

      return this.response(
        { category_id: id },
        'Category deleted successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async deleteMany(ids: number[]) {
    try {
      await this.prisma.category.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return this.response(
        { category_ids: ids },
        'Categories deleted successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  // UTILS
  private searchByName(name: string) {
    if (!name) return this;

    this.queryOptions = {
      ...this.queryOptions,
      name: {
        contains: name,
        mode: 'insensitive',
      },
    };
  }

  private sortBy(
    queryOrder: { [key: string]: string } = {
      createdAt: 'desc',
    },
  ) {
    const field = Object.keys(queryOrder)[0] || 'createdAt';
    const sort = queryOrder[field].toLowerCase() || 'desc';

    return {
      orderBy: {
        [field]: sort,
      },
    };
  }

  private response(data: any, message: string, meta?: any) {
    return {
      error: false,
      message,
      data: {
        ...data,
      },
      meta,
    };
  }
}
