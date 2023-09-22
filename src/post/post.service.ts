import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, PostStatus, UpdatePostDto } from './dto';
import { MediaService } from 'src/media/media.service';
import { extname } from 'path';

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

      // create filename for thumbnail
      if (thumbnail)
        payload.thumbnail =
          Date.now().toString() + extname(thumbnail.originalname);

      // generate key for private post
      if (payload.status === 'private')
        payload.keyPost = this.generateKeyForPrivatePost();

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

      // upload thumbnail to firebase storage
      if (postCreated && thumbnail) {
        await this.mediaService.uploadFile(thumbnail, postCreated.thumbnail);
      }

      // get download url for thumbnail
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
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
    const where = { ...this.filterPost(query) };
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
          slug: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    };

    // data
    const [posts, count] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        take: Number(limit),
        skip: Number(offset),
        select,
        where,
        orderBy: {
          publishedAt: 'desc',
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // metadata
    const meta = {
      ...(await this.prisma.paginate({
        count,
        page,
        limit,
      })),
      total_data_per_page: posts.length,
    };

    const postsWithThumbnail = await Promise.all(
      posts.map(async (post) => {
        post.thumbnail = await this.mediaService.getFileDownloadUrl(
          post.thumbnail,
        );
        return post;
      }),
    );

    return this.response(
      {
        posts: postsWithThumbnail,
      },
      'Posts retrieved successfully',
      meta,
    );
  }

  async getOne(idOrSlug: number | string, query?: any, otherCondition?: any) {
    const post = isNaN(Number(idOrSlug))
      ? await this.getOneBySlug(idOrSlug as string, otherCondition)
      : await this.getOneById(Number(idOrSlug), otherCondition);

    if (post.status === 'private') {
      if (!query.keyPost) {
        throw new BadRequestException('This post is private');
      }

      if (query.keyPost !== post.keyPost) {
        throw new BadRequestException('Key post is invalid');
      }
    }

    return this.response({ post }, 'Post retrieved successfully');
  }

  private async getOneBySlug(slug: string, otherCondition?: any) {
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
        ...otherCondition,
      },
    });

    if (!post) {
      throw new NotFoundException('Record not found');
    }

    return post;
  }

  private async getOneById(id: number, otherCondition?: any) {
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
        ...otherCondition,
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
      const {
        type,
        tags,
        thumbnail: thumbnailExist,
      } = await this.getOneById(id);

      if (payload.status) {
        payload.publishedAt = await this.setPublishedAt(
          payload.status,
          payload.publishedAt,
        );

        payload.status === 'private'
          ? (payload.keyPost = this.generateKeyForPrivatePost())
          : (payload.keyPost = null);
      }

      if (payload.tags) {
        this.validationTags(payload.tags);
        tags && (payload.tags = [...new Set([...tags, ...payload.tags])]);
      }

      if (thumbnail) {
        payload.thumbnail = `${type}-${Date.now().toString()}${extname(
          thumbnail.originalname,
        )}`;
      }

      const postUpdated = await this.prisma.post.update({
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
        where: {
          id,
          ...otherCondition,
        },
        data: {
          ...payload,
          ...(slug.length > 0 && { slug }),
        },
      });

      // upload thumbnail to firebase storage
      if (postUpdated && thumbnail) {
        await this.mediaService.deleteFile(thumbnailExist);
        await this.mediaService.uploadFile(thumbnail, postUpdated.thumbnail);
        delete postUpdated.thumbnail;
      }

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

      await this.prisma.post.delete({
        where: {
          id,
          ...otherCondition,
        },
      });

      // delete thumbnail from firebase storage
      thumbnail && (await this.mediaService.deleteFile(thumbnail));

      return this.response({ post_id: id }, 'Post deleted successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  // ---------------------------- Public User ----------------------------
  async getAllPublic(query: any = {}) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
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
    const excludeStatus = [
      PostStatus.PRIVATE,
      PostStatus.ARCHIVED,
      PostStatus.DRAFT,
      PostStatus.UNPUBLISHED,
    ];
    const where = {
      ...this.filterPost(query),
      status: {
        notIn: excludeStatus,
      },
    };

    // data
    const [posts, count] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        take: Number(limit),
        skip: Number(offset),
        select,
        orderBy: {
          publishedAt: 'desc',
        },
        where,
      }),
      this.prisma.post.count({ where }),
    ]);

    // metadata
    const meta = {
      ...(await this.prisma.paginate({
        count,
        page,
        limit,
      })),
      total_data_per_page: posts.length,
    };

    const postsWithThumbnail = await Promise.all(
      posts.map(async (post) => {
        post.thumbnail = await this.mediaService.getFileDownloadUrl(
          post.thumbnail,
        );
        return post;
      }),
    );

    return this.response(
      {
        posts: postsWithThumbnail,
      },
      'Posts retrieved successfully',
      meta,
    );
  }

  async getOnePublic(idOrSlug: number | string, query?: any) {
    const condition = {
      status: {
        notIn: [PostStatus.ARCHIVED, PostStatus.DRAFT, PostStatus.UNPUBLISHED],
      },
    };

    return await this.getOne(idOrSlug, query, condition);
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

  private searchByStatus(status: string) {
    if (!status) return this;

    this.queryOptions = {
      ...this.queryOptions,
      status: {
        in: typeof status === 'string' ? [status] : status,
      },
    };

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

  private searchByCategory(idOrSlug: number | string) {
    if (!idOrSlug) return this;

    const condition = isNaN(Number(idOrSlug))
      ? {
          OR: [
            { slug: idOrSlug as string },
            { name: { contains: idOrSlug as string, mode: 'insensitive' } },
          ],
        }
      : { id: Number(idOrSlug) };

    this.queryOptions = {
      ...this.queryOptions,
      category: {
        ...condition,
      },
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

  private validationTags(tags: string[]) {
    if (tags.filter((tag) => !tag).length > 0) {
      throw new BadRequestException('Tags cannot be empty');
    }
  }

  private filterPost(query: any) {
    const { title, status, published, tags, type, category } = query;

    this.searchByTitle(title)
      .searchByStatus(status)
      .searchByPublished(published)
      .searchByTags(tags)
      .searchByType(type)
      .searchByCategory(category);

    const criteria = {
      ...this.queryOptions,
    };

    this.queryOptions = {};

    return criteria;
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
