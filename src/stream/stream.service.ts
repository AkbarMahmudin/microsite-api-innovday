import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStreamDto } from './dto';
import { PostItem, PostStatus } from 'src/type';
import { MediaService } from 'src/media/media.service';
import { extname } from 'path';
import { UpdateStreamDto } from './dto/update-stream.dto';

@Injectable()
export class StreamService {
  private defaultSelectedFields = {
    id: true,
    title: true,
    slug: true,
    thumbnail: true,
    status: true,
    category: {
      select: {
        id: true,
        name: true,
      },
    },
    author: {
      select: {
        id: true,
        name: true,
      },
    },
    stream: {
      select: {
        id: true,
        youtubeId: true,
        slidoId: true,
        startDate: true,
        endDate: true,
      },
    },
    publishedAt: true,
  };

  private queryOptions = {};

  constructor(private prisma: PrismaService, private media: MediaService) {}

  async create(payload: CreateStreamDto, thumbnail: Express.Multer.File) {
    try {
      const {
        youtubeId,
        slidoId,
        startDate,
        endDate,
        key = this.generateKeyForPrivateStream(payload.status),
      } = payload;

      const { speakerId, moderatorId } = payload.userStreamIds;

      // VALIDATE SPEAKER
      if (!(await this.isSpeaker(speakerId))) {
        throw new BadRequestException('Is not a speaker');
      }

      // VALIDATE DATE
      this.isDateValid(payload);

      const filename = this.generateFileName(thumbnail, 'stream-thumbnail');

      const post: PostItem = {
        title: payload.title,
        slug: payload.title.toLowerCase().replace(/ /g, '-'),
        content: payload.content,
        thumbnail: filename,
        status: payload.status || PostStatus.DRAFT,
        type: 'stream',
        tags: this.validationTags(payload.tags),
        publishedAt: this.setPublishedAt(payload.status, payload.publishedAt),
        categoryId: Number(payload.categoryId),
        authorId: payload.authorId,
      };

      const stream = {
        youtubeId,
        slidoId,
        startDate,
        endDate,
        key,
        users: {
          createMany: {
            data: [
              {
                userId: Number(speakerId),
              },
              {
                userId: Number(moderatorId),
              },
            ],
          },
        },
      };

      const streamCreated = await this.prisma.post.create({
        data: {
          ...post,
          stream: {
            create: stream,
          },
        },
        include: {
          stream: true,
        },
      });

      if (thumbnail && streamCreated) {
        await this.media.uploadFile(thumbnail, filename);
      }

      streamCreated.thumbnail = await this.media.getFileDownloadUrl(filename);

      const responseData = {
        post_id: streamCreated.id,
        stream_id: streamCreated.stream.id,
      };

      return this.response(responseData, 'Stream created successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getAll(query: any = {}, otherCondition?: any) {
    try {
      const { page = 1, limit = 10 } = query;
      const offset = (page - 1) * limit;
      const where = {
        ...this.filterStream(query),
        ...otherCondition,
        type: 'stream',
      };

      const [streams, count] = await this.prisma.$transaction([
        this.prisma.post.findMany({
          take: Number(limit),
          skip: Number(offset),
          select: this.defaultSelectedFields,
          where,
          orderBy: {
            publishedAt: 'desc',
          },
        }),
        this.prisma.post.count({ where }),
      ]);

      // * METADATA
      const meta = {
        ...(await this.prisma.paginate({
          count,
          page,
          limit,
        })),
        total_data_per_page: streams.length,
      };

      // * STREAMS WITH THUMBNAIL
      const streamsWithThumbnail = await Promise.all(
        streams.map(async (stream) => {
          if (stream.thumbnail) {
            stream.thumbnail = await this.media.getFileDownloadUrl(
              stream.thumbnail,
            );
          }
          stream['streamId'] = stream.stream.id;
          delete stream.stream.id;

          const streamMapped = {
            ...stream,
            ...stream.stream,
          };
          delete streamMapped.stream;

          return streamMapped;
        }),
      );

      return this.response(
        { streams: streamsWithThumbnail },
        'Get all streams successfully',
        meta,
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getOne(idOrSlug: number | string, otherCondition?: any) {
    try {
      const selectedFields = {
        ...this.defaultSelectedFields,
        content: true,
        tags: true,
        stream: {
          select: {
            id: true,
            youtubeId: true,
            slidoId: true,
            startDate: true,
            endDate: true,
            key: true,
            users: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const condition = isNaN(Number(idOrSlug))
        ? { slug: idOrSlug as string }
        : { id: Number(idOrSlug) };

      const postStream = await this.prisma.post.findUnique({
        select: selectedFields,
        where: {
          ...condition,
          ...otherCondition,
          type: 'stream',
        },
      });

      if (!postStream) {
        throw new NotFoundException('Stream is not found');
      }

      if (postStream.thumbnail) {
        postStream.thumbnail = await this.media.getFileDownloadUrl(
          postStream.thumbnail,
        );
      }

      postStream['streamId'] = postStream.stream.id;
      delete postStream.stream.id;

      const { stream } = postStream;
      const { users } = stream;

      delete postStream.stream;

      const responseData = {
        ...postStream,
        ...stream,
        users: this.usersStreamMapped(users),
      };

      return this.response({ stream: responseData }, 'Get stream successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async update(
    id: number,
    payload: UpdateStreamDto,
    thumbnail: Express.Multer.File,
  ) {
    try {
      const { stream: postExist } = (await this.getOne(id)).data;

      // VALIDATE AUTHOR POST
      await this.validateAuthor(payload.authorId, postExist.author.id);

      // VALIDATE DATE
      this.isDateValid(payload, postExist);

      const post = {
        ...(payload.title && {
          title: payload.title,
          slug: payload.title.toLowerCase().replace(/ /g, '-'),
        }),
        ...(payload.content && { content: payload.content }),
        ...(payload.status && {
          status: payload.status,
          publishedAt: this.setPublishedAt(
            payload.status,
            payload.publishedAt ?? null,
          ),
        }),
        ...(payload.tags && {
          tags: this.validationTags([...postExist.tags, ...payload.tags]),
        }),
        ...(payload.categoryId && { categoryId: Number(payload.categoryId) }),
        ...(payload.authorId && { authorId: Number(payload.authorId) }),
        ...(thumbnail && {
          thumbnail: this.generateFileName(thumbnail, 'stream-thumbnail'),
        }),
      };

      const stream = {
        ...(payload.youtubeId && { youtubeId: payload.youtubeId }),
        ...(payload.slidoId && { slidoId: payload.slidoId }),
        ...(payload.startDate && { startDate: payload.startDate }),
        ...(payload.endDate && { endDate: payload.endDate }),
        ...(payload.status && {
          key: this.generateKeyForPrivateStream(payload.status),
        }),
      };

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedPost = await tx.post.update({
          where: {
            id,
          },
          data: post,
        });

        const updatedStream = await tx.stream.update({
          where: {
            postId: id,
          },
          data: stream,
          include: {
            users: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (payload.userStreamIds) {
          const userStreams = this.usersStreamMapped(updatedStream.users);
          const { deletedUserStream, createdUserStream } =
            await this.updateUserStream(payload.userStreamIds, userStreams);

          deletedUserStream.length &&
            (await tx.userStream.deleteMany({
              where: {
                streamId: updatedStream.id,
                userId: {
                  in: deletedUserStream,
                },
              },
            }));

          createdUserStream.length &&
            (await tx.userStream.createMany({
              data: createdUserStream.map((userId) => ({
                userId,
                streamId: updatedStream.id,
              })),
            }));
        }

        return {
          post: updatedPost,
          stream: updatedStream,
        };
      });

      if (result && thumbnail) {
        await this.media.deleteFile(postExist.thumbnail);
        await this.media.uploadFile(thumbnail, post.thumbnail);
      }

      const responseData = {
        post_id: result.post.id,
        stream_id: result.stream.id,
      };

      return this.response(responseData, 'Stream updated successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number, authorId: number) {
    try {
      const { stream: postExist } = (await this.getOne(id)).data;

      // VALIDATE AUTHOR POST authorId
      await this.validateAuthor(authorId, postExist.author.id);

      const { id: post_id } = await this.prisma.post.delete({
        where: {
          id,
          type: 'stream',
        },
      });

      if (post_id && postExist.thumbnail) {
        await this.media.deleteFile(postExist.thumbnail);
      }

      return this.response({ post_id }, 'Stream deleted successfully');
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
          select: {
            id: true,
            thumbnail: true,
            authorId: true,
          },
          where: {
            id: {
              in: ids,
            },
            type: 'stream',
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
        });

        if (posts.length !== ids.length) {
          throw new BadRequestException('Some streams are not found');
        }

        const { count } = await tx.post.deleteMany({
          where: {
            id: {
              in: ids,
            },
            type: 'stream',
            authorId,
          },
        });

        return {
          posts,
          count,
        };
      });

      if (count && posts.length > 0) {
        await Promise.all(
          posts.map(async (post) => {
            if (post.thumbnail) {
              await this.media.deleteFile(post.thumbnail);
            }
          }),
        );
      }

      return this.response({ count }, 'Streams deleted successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async updateUserStream(
    userStreamIds: {
      speakerId: number;
      moderatorId: number;
    },
    usersExist: any[],
  ) {
    try {
      const { speakerId, moderatorId } = userStreamIds;

      // VALIDATE SPEAKER AND MODERATOR
      if (speakerId === moderatorId) {
        throw new BadRequestException(
          'Speaker and moderator cannot be the same',
        );
      }

      if (!(await this.isSpeaker(speakerId))) {
        throw new BadRequestException('Is not a speaker');
      }

      if (await this.isSpeaker(moderatorId)) {
        throw new BadRequestException('Moderator cannot be a speaker');
      }

      const [isNotSpeaker] = usersExist.filter(
        ({ id, role }) =>
          role === 'speaker' && Number(id) !== Number(speakerId),
      );
      const [isNotModerator] = usersExist.filter(
        ({ id, role }) =>
          role !== 'speaker' &&
          role !== 'admin' &&
          Number(id) !== Number(moderatorId),
      );

      return {
        deletedUserStream: [
          (isNotSpeaker && isNotSpeaker.id) || null,
          (isNotModerator && isNotModerator.id) || null,
        ].filter((v) => v !== null),
        createdUserStream: [
          (isNotSpeaker !== Number(speakerId) && Number(speakerId)) || null,
          (isNotModerator !== Number(moderatorId) && Number(moderatorId)) ||
            null,
        ].filter(
          (v) => v !== null && !usersExist.map(({ id }) => id).includes(v),
        ),
      };
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  // * -------------------- PUBLIC (No Auth) --------------------
  private readonly excludeStatus = [
    PostStatus.DRAFT,
    PostStatus.ARCHIVED,
    PostStatus.PRIVATE,
    PostStatus.UNPUBLISHED,
  ];

  async getAllPublic(query: any = {}) {
    return await this.getAll(query, {
      status: {
        notIn: this.excludeStatus,
      },
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    });
  }

  async getOnePublic(idOrSlug: number | string) {
    return await this.getOne(idOrSlug, {
      status: {
        notIn: this.excludeStatus,
      },
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    });
  }

  async getRelatedPublic(idOrSlug: number | string) {
    try {
      const { stream: postExist } = (await this.getOnePublic(idOrSlug)).data;

      const relatedPosts = await this.prisma.post.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          publishedAt: true,
        },
        where: {
          id: {
            not: postExist.id,
          },
          status: {
            notIn: this.excludeStatus,
          },
          categoryId: postExist.category.id,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });

      const relatedPostsWithThumbnail = await Promise.all(
        relatedPosts.map(async (post) => {
          if (post.thumbnail) {
            post.thumbnail = await this.media.getFileDownloadUrl(
              post.thumbnail,
            );
          }

          return post;
        }),
      );

      return this.response(
        { posts: relatedPostsWithThumbnail },
        'Get related posts successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getComingSoons() {
    try {
      const postStream = await this.getAllPublic({
        status: 'scheduled',
        published: true,
      });

      const { streams } = postStream.data;

      const comingSoons = streams.filter(
        (stream) => stream.startDate > new Date(),
      );

      return this.response(
        { streams: comingSoons },
        'Get coming soon streams successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getLives() {
    try {
      const postStream = await this.getAllPublic({
        status: 'published',
        published: true,
      });

      const { streams } = postStream.data;

      const lives = streams.filter(
        (stream) =>
          stream.startDate <= new Date() && stream.endDate >= new Date(),
      );

      return this.response({ streams: lives }, 'Get live streams successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getOnePrivate(query: any = {}) {
    const { key } = query;

    if (!key) {
      throw new BadRequestException('Key is required');
    }

    const selectedFields = {
      ...this.defaultSelectedFields,
      content: true,
      tags: true,
      stream: {
        select: {
          id: true,
          youtubeId: true,
          slidoId: true,
          startDate: true,
          endDate: true,
          key: true,
          users: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const postStream = await this.prisma.post.findFirst({
      select: selectedFields,
      where: {
        stream: {
          key,
        },
        type: 'stream',
      },
    });

    if (!postStream) {
      throw new NotFoundException('Stream is not found');
    }

    if (postStream.thumbnail) {
      postStream.thumbnail = await this.media.getFileDownloadUrl(
        postStream.thumbnail,
      );
    }

    postStream['streamId'] = postStream.stream.id;
    delete postStream.stream.id;

    const { stream } = postStream;
    const { users } = stream;

    delete postStream.stream;

    const responseData = {
      ...postStream,
      ...stream,
      users: this.usersStreamMapped(users),
    };

    return this.response({ stream: responseData }, 'Get stream successfully');
  }
  // * ------------------ END PUBLIC ------------------

  // -------------------- UTILS --------------------
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

  private generateKeyForPrivateStream(status: string) {
    if (status !== 'private') return null;

    return Math.random().toString(36).slice(-8);
  }

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

  private generateFileName(file: Express.Multer.File, prefix?: string) {
    if (!file) return null;

    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    const prefixName = prefix ? `${prefix}-` : '';

    return `${prefixName}${randomName}${extname(file.originalname)}`;
  }

  private usersStreamMapped(users: any[]) {
    return users.map(({ user }) => ({
      id: user.id,
      name: user.name,
      role: user.role.name,
    }));
  }

  private async isSpeaker(userId: number) {
    const user = await this.prisma.user.findUnique({
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    if (user.role.name !== 'speaker') {
      return false;
    }

    return true;
  }

  private validationTags(tags: string[]) {
    if (!tags) return [];

    if (tags.filter((tag) => !tag).length > 0) {
      throw new BadRequestException('Tags cannot be empty');
    }

    return [...new Set(tags.map((tag) => tag.toLowerCase()))];
  }

  private isDateValid(payload, postExist?: any) {
    const { startDate, endDate } = payload;

    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        throw new BadRequestException(
          'Start date cannot be greater than end date',
        );
      }
      return;
    }

    if ((startDate && postExist) || (endDate && postExist)) {
      if (new Date(startDate) > new Date(postExist.endDate)) {
        throw new BadRequestException(
          'Start date cannot be greater than the previous end date',
        );
      }

      if (new Date(endDate) < new Date(postExist.startDate)) {
        throw new BadRequestException(
          'End date cannot be less than the previous start date',
        );
      }
    }
  }

  // * -------------------- FILTER --------------------
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

  private filterStream(query: any) {
    const { title, status, published, tags, category } = query;

    this.searchByTitle(title)
      .searchByStatus(status)
      .searchByPublished(published)
      .searchByTags(tags)
      .searchByCategory(category);

    const criteria = {
      ...this.queryOptions,
    };

    this.queryOptions = {};

    return criteria;
  }
  // * ------------------ END FILTER ------------------

  // ------------------ END UTILS ------------------

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
