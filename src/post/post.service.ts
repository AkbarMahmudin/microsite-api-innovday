import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(payload: CreatePostDto) {
    try {
      const slug = payload.title.toLowerCase().replace(/ /g, '-');
      const publishedAt = await this.setPublishedAt(
        payload.status,
        payload.publishedAt,
      );

      const postCreated = await this.prisma.post.create({
        data: {
          ...payload,
          slug,
          publishedAt,
        },
      });

      return this.response({ post: postCreated }, 'Post created successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getAll(query: any = {}) {
    const { title, status, published, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
    const options: any = {
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        publishedAt: 'desc',
      },
    };

    if (title) {
      options.where = {
        title: {
          contains: title,
          mode: 'insensitive',
        },
      };
    }

    if (status) {
      options.where = {
        status: {
          in: typeof status === 'string' ? [status] : status,
        },
      };
    }

    if (published) {
      options.where = {
        ...options.where,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      };
    }

    const posts = await this.prisma.post.findMany(options);
    const count = await this.prisma.post.count();
    const totalPages = Math.ceil(count / limit);
    const meta = {
      page: Number(page),
      limit: Number(limit),
      total_data: posts.length,
      total_page: totalPages,
    };

    return this.response({ posts }, 'Posts retrieved successfully', meta);
  }

  async getOne(idOrSlug: number | string) {
    const post = isNaN(Number(idOrSlug))
      ? await this.getOneBySlug(idOrSlug as string)
      : await this.getOneById(Number(idOrSlug));

    return this.response({ post }, 'Post retrieved successfully');
  }

  private async getOneBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      where: {
        slug,
      },
    });

    if (!post) {
      throw new NotFoundException('Record not found');
    }

    return post;
  }

  private async getOneById(id: number) {
    const post = await this.prisma.post.findUnique({
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      where: {
        id: Number(id),
      },
    });

    if (!post) {
      throw new NotFoundException('Record not found');
    }

    return post;
  }

  async update(id: number, payload: UpdatePostDto) {
    let slug = '';
    if (payload.title) {
      slug = payload.title.toLowerCase().replace(/ /g, '-');
    }

    try {
      if (payload.status) {
        payload.publishedAt = await this.setPublishedAt(
          payload.status,
          payload.publishedAt,
        );
      }

      const postUpdated = await this.prisma.post.update({
        where: {
          id,
        },
        data: {
          ...payload,
          ...(slug.length > 0 && { slug }),
        },
      });

      return this.response({ post: postUpdated }, 'Post updated successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number) {
    try {
      await this.prisma.post.delete({
        where: {
          id,
        },
      });

      return this.response({ post_id: id }, 'Post deleted successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  private setPublishedAt(status: string, publishedAt: Date | null = null) {
    if (status === 'published') {
      return new Date();
    }

    if (status === 'scheduled' && publishedAt === null) {
      throw new BadRequestException(
        'Published date is required for scheduled posts',
      );
    }

    if (status === 'unpublished' || status === 'archived') {
      return null;
    }

    return publishedAt;
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
