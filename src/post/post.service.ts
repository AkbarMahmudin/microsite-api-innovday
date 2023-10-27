import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { PostStatus } from 'src/type';
import { MediaService } from 'src/media/media.service';
import { extname } from 'path';

@Injectable()
export class PostService {
  private queryOptions = {};

  private defaultSelectedFields = {
    id: true,
    title: true,
    slug: true,
    description: true,
    thumbnail: true,
    status: true,
    tags: true,
    type: true,
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    author: {
      select: {
        id: true,
        name: true,
      },
    },
    publishedAt: true,
    // Metadata for SEO
    metaTitle: true,
    metaDescription: true,
    metaKeywords: true,
  };

  constructor(
    private prisma: PrismaService,
    private mediaService: MediaService,
  ) {}

  // ---------------------------- Main CRUD ----------------------------

  async create(
    userId: number,
    payload: CreatePostDto,
    thumbnail?: Express.Multer.File,
  ) {
    try {
      // validate author
      await this.validateAuthor(userId);

      const slug = payload.title.toLowerCase().replace(/ /g, '-');
      const publishedAt = await this.setPublishedAt(
        payload.status,
        payload.publishedAt,
      );

      payload.categoryId = Number(payload.categoryId);
      payload.tags && this.validationTags(payload.tags);

      // create filename for thumbnail
      if (thumbnail)
        payload.thumbnail = this.generateFileName(thumbnail, 'post-thumbnail');

      // set metadata for SEO
      this.setMetadata(payload);

      const postCreated = await this.prisma.post.create({
        select: this.defaultSelectedFields,
        data: {
          ...payload,
          authorId: userId,
          type: 'post',
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

  async getAll(query: any = {}, otherCondition?: any) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
    const where = {
      ...this.filterPost(query),
      ...otherCondition,
      type: 'post',
    };

    const aggregate = await this.prisma.post.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: {
        type: 'post',
      },
    });

    const aggregateStatus = aggregate.reduce((acc, cur) => {
      acc[cur.status] = cur._count.status;
      return acc;
    }, {});

    // data
    const [posts, count] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        take: Number(limit),
        skip: Number(offset),
        select: this.defaultSelectedFields,
        where,
        ...this.sortBy(query.sort),
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
        status: aggregateStatus,
      },
      'Posts retrieved successfully',
      meta,
    );
  }

  async getOne(idOrSlug: number | string, otherCondition?: any) {
    const condition = isNaN(Number(idOrSlug))
      ? { slug: idOrSlug as string }
      : { id: Number(idOrSlug) };

    const post = await this.prisma.post.findUnique({
      include: {
        category: true,
        author: true,
      },
      where: {
        ...condition,
        ...otherCondition,
        type: 'post',
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.thumbnail = await this.mediaService.getFileDownloadUrl(post.thumbnail);

    return this.response({ post }, 'Post retrieved successfully');
  }

  async update(
    id: number,
    userId,
    payload: UpdatePostDto,
    thumbnail?: Express.Multer.File,
    otherCondition?: any,
  ) {
    const slug = payload.title
      ? payload.title.toLowerCase().replace(/ /g, '-')
      : '';

    this.setMetadata(payload);

    try {
      const {
        author,
        tags,
        thumbnail: thumbnailExist,
      } = (await this.getOne(id)).data.post;

      // validate author
      await this.validateAuthor(userId, author.id);

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
        payload.thumbnail = this.generateFileName(thumbnail, 'post-thumbnail');
      }

      const postUpdated = await this.prisma.post.update({
        where: {
          id,
          ...otherCondition,
          type: 'post',
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

      return this.response(
        { post_id: postUpdated.id },
        'Post updated successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number, userId: number) {
    try {
      const { thumbnail, author } = (await this.getOne(id)).data.post;

      // validate author
      await this.validateAuthor(userId, author.id);

      await this.prisma.post.delete({
        where: {
          id,
          type: 'post',
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

  async deleteMany(ids: number[], authorId: number) {
    try {
      const { posts, count } = await this.prisma.$transaction(async (tx) => {
        const posts = await tx.post.findMany({
          where: {
            id: {
              in: ids,
            },
            type: 'post',
            OR: [
              {
                authorId,
              },
              {
                author: {
                  role: {
                    name: 'admin',
                  },
                },
              },
            ],
          },
          include: {
            author: true,
          },
        });

        if (posts.length !== ids.length) {
          throw new BadRequestException('Some posts are not found');
        }

        const { count } = await tx.post.deleteMany({
          where: {
            id: {
              in: ids,
            },
            type: 'post',
          },
        });

        return { posts, count };
      });

      if (count && posts.length > 0) {
        await Promise.all(
          posts.map(async (post) => {
            if (post.thumbnail) {
              await this.mediaService.deleteFile(post.thumbnail);
            }
          }),
        );
      }

      return this.response({ count }, 'Posts deleted successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  // * ---------------------------- Public User ----------------------------
  private excludeStatus = [
    PostStatus.ARCHIVED,
    PostStatus.DRAFT,
    PostStatus.PRIVATE,
  ];

  async getAllPublic(query: any = {}) {
    const posts = await this.getAll(query, {
      status: {
        notIn: this.excludeStatus,
      },
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    });

    delete posts.data.status;

    return posts;
  }

  async getOnePublic(idOrSlug: number | string) {
    const condition = {
      type: 'post',
      status: {
        notIn: this.excludeStatus,
      },
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    };

    return await this.getOne(idOrSlug, condition);
  }

  // * ---------------------------- UTILS ----------------------------

  private generateFileName(file: Express.Multer.File, prefix?: string) {
    if (!file) return null;

    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    const prefixName = prefix ? `${prefix}-` : '';

    return `${prefixName}${randomName}${extname(file.originalname)}`;
  }

  private setMetadata(payload: CreatePostDto | UpdatePostDto) {
    const { title, description, tags } = payload;

    if (!title || !description) return;

    payload.metaTitle = title;
    payload.metaDescription = description;
    payload.metaKeywords = tags
      ? tags.map((tag) => tag.toLowerCase()).join(', ')
      : '';
  }

  // * ---------------------------- FILTER ----------------------------

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

  // * ---------------------------- VALIDATION ----------------------------

  private async validateAuthor(userId: number, authorId?: any) {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      throw new BadRequestException('Author is not valid');
    }

    if (user.role.name !== 'admin' && userId !== authorId) {
      throw new ForbiddenException('You are not the author of this post');
    }

    return user;
  }

  private validationTags(tags: string[]) {
    if (tags.filter((tag) => !tag).length > 0) {
      throw new BadRequestException('Tags cannot be empty');
    }
  }

  private validatePublishedAt(publishedAt: Date) {
    const currentDate = new Date();

    if (publishedAt < currentDate) {
      throw new BadRequestException('Published date cannot be less than today');
    }
  }

  // * ---------------------------- RESPONSE ----------------------------

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
