import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class PostService {
  private queryOptions = {};

  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  // ---------------------------- Main CRUD ----------------------------

  async create(payload: CreatePostDto, thumbnail?: Express.Multer.File) {
    try {
      const slug = payload.title.toLowerCase().replace(/ /g, '-');
      const publishedAt = await this.setPublishedAt(
        payload.status,
        payload.publishedAt,
      );

      payload.categoryId = Number(payload.categoryId);
      payload.tags && this.validationTags(payload.tags);

      if (thumbnail) {
        const { name } = (await this.mediaService.uploadFile(thumbnail))
          .metadata;
        payload.thumbnail = name;
      }

      if (payload.status === 'private') {
        payload.keyPost = this.generateKeyForPrivatePost();
      }

      const select = {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        status: true,
        tags: true,
        type: true,
      };

      const postCreated = await this.prisma.post.create({
        select,
        data: {
          ...payload,
          slug,
          publishedAt,
        },
      });
      postCreated.thumbnail = await this.mediaService.getFileDownloadUrl(
        postCreated.thumbnail,
      );

      return this.response({ post: postCreated }, 'Post created successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getAll(query: any = {}) {
    const {
      title,
      status,
      published,
      tags,
      keyPost,
      type,
      page = 1,
      limit = 10,
    } = query;
    const offset = (page - 1) * limit;

    this.searchByTitle(title)
      .searchByStatus(status, keyPost)
      .searchByPublished(published)
      .searchByTags(tags)
      .searchByType(type);

    const select = {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      status: true,
      type: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    };

    const posts = await this.prisma.post.findMany({
      take: Number(limit),
      skip: Number(offset),
      select,
      orderBy: {
        publishedAt: 'desc',
      },
      where: {
        ...this.queryOptions,
      },
    });
    const count = await this.prisma.post.count();
    const totalPages = Math.ceil(count / limit);
    const meta = {
      page: Number(page),
      limit: Number(limit),
      total_data_per_page: posts.length,
      total_data: count,
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

  async update(
    id: number,
    payload: UpdatePostDto,
    thumbnail?: Express.Multer.File,
    otherCondition?: any,
  ) {
    let slug = '';
    if (payload.title) {
      slug = payload.title.toLowerCase().replace(/ /g, '-');
    }

    try {
      const { tags, thumbnail: thumbnailExist } = await this.getOneById(id);

      if (payload.status) {
        payload.publishedAt = await this.setPublishedAt(
          payload.status,
          payload.publishedAt,
        );
      }

      if (payload.tags) {
        this.validationTags(payload.tags);
        tags && (payload.tags = [...new Set([...tags, ...payload.tags])]);
      }

      if (thumbnail) {
        const { name } = (await this.mediaService.uploadFile(thumbnail))
          .metadata;
        payload.thumbnail = name;
        thumbnailExist && (await this.mediaService.deleteFile(thumbnailExist));
      }

      const postUpdated = await this.prisma.post.update({
        where: {
          id,
          ...otherCondition,
        },
        data: {
          ...payload,
          ...(slug.length > 0 && { slug }),
        },
      });
      postUpdated.thumbnail = await this.mediaService.getFileDownloadUrl(
        postUpdated.thumbnail,
      );

      return this.response({ post: postUpdated }, 'Post updated successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number, otherCondition?: any) {
    try {
      const { thumbnail } = await this.getOneById(id);
      thumbnail && (await this.mediaService.deleteFile(thumbnail));

      await this.prisma.post.delete({
        where: {
          id,
          ...otherCondition,
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

  // ---------------------------- Other CRUD ----------------------------

  private searchByTitle(title: string) {
    if (!title) return this;

    this.queryOptions = {
      ...this.queryOptions,
      title: {
        contains: title,
        mode: 'insensitive',
      },
    };
    return this;
  }

  private searchByStatus(status: string, keyPost?: string) {
    if (!status) return this;

    if (status === 'private') {
      if (!keyPost) {
        throw new BadRequestException('Key post is required');
      }
      this.queryOptions = {
        ...this.queryOptions,
        status: {
          in: ['private'],
        },
        keyPost,
      };
    } else {
      this.queryOptions = {
        ...this.queryOptions,
        status: {
          in: typeof status === 'string' ? [status] : status,
        },
      };
    }
    return this;
  }

  private searchByPublished(published: boolean) {
    if (!published) return this;

    this.queryOptions = {
      ...this.queryOptions,
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    };
    return this;
  }

  private searchByTags(tags: string[]) {
    if (!tags) return this;

    this.queryOptions = {
      ...this.queryOptions,
      tags: {
        hasSome: typeof tags === 'string' ? [tags] : tags,
      },
    };
    return this;
  }

  private searchByType(type: string) {
    if (!type) return this;

    this.queryOptions = {
      ...this.queryOptions,
      type,
    };
    return this;
  }

  private generateKeyForPrivatePost() {
    return Math.random().toString(36).slice(-8);
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

  async getPostThumbnail(thumbnail: string) {
    const stream = await this.mediaService.getFileStream(thumbnail);
    return stream;
  }

  private validationTags(tags: string[]) {
    if (tags.filter((tag) => !tag).length > 0) {
      throw new BadRequestException('Tags cannot be empty');
    }
  }

  response(data: any, message: string, meta?: any) {
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
