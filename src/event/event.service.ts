import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from 'src/post/dto';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private postService: PostService,
  ) {}

  async create(
    userId: number,
    payload: CreatePostDto,
    thumbnail?: Express.Multer.File,
  ) {
    try {
      this.createAsEvent(payload);

      const { post: eventCreated } = (
        await this.postService.create(userId, payload, thumbnail)
      ).data;

      return this.postService.response(
        { event: eventCreated },
        'Event created successfully',
      );
    } catch (err) {
      err.code && this.prisma.prismaError(err);
      throw err;
    }
  }

  async getAll(query: any = {}) {
    const { data, meta } = await this.postService.getAll({
      ...query,
      type: 'event',
    });
    const events = data.posts;

    return this.postService.response(
      {
        events,
      },
      'Events retrieved successfully',
      meta,
    );
  }

  async getOne(idorSlug: string | number) {
    const { post: event } = (
      await this.postService.getOne(idorSlug, {
        type: 'event',
      })
    ).data;

    return this.postService.response({ event }, 'Event retrieved successfully');
  }

  async update(
    id: number,
    userId: number,
    payload: UpdatePostDto,
    thumbnail?: Express.Multer.File,
  ) {
    try {
      const { post_id: event_id } = (
        await this.postService.update(id, userId, payload, thumbnail, {
          type: 'event',
        })
      ).data;

      return this.postService.response(
        { event_id },
        'Event updated successfully',
      );
    } catch (err) {
      err.code && this.prisma.prismaError(err);
      throw err;
    }
  }

  async delete(id: number, userId: number) {
    try {
      const { post_id: event_id } = (
        await this.postService.delete(id, userId, {
          type: 'event',
        })
      ).data;

      return this.postService.response(
        { event_id },
        'Event deleted successfully',
      );
    } catch (err) {
      err.code && this.prisma.prismaError(err);
      throw err;
    }
  }

  // ------------------------------ Public -------------------------------
  async getAllPublic(query: any = {}) {
    const { data, meta } = await this.postService.getAllPublic({
      ...query,
      type: 'event',
    });

    return this.postService.response(
      {
        events: data.posts,
      },
      'Events retrieved successfully',
      meta,
    );
  }

  async getOnePublic(idorSlug: string | number) {
    const { post: event } = (
      await this.postService.getOnePublic(idorSlug, {
        type: 'event',
      })
    ).data;

    return this.postService.response({ event }, 'Event retrieved successfully');
  }

  // ------------------------------ Private ------------------------------
  async getOnePrivate(key: string) {
    if (!key) {
      throw new BadRequestException('Key is required');
    }

    const event = await this.prisma.post.findUnique({
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        keyPost: key,
        type: 'event',
      },
    });

    if (!event) {
      throw new BadRequestException('Event not found');
    }

    return this.postService.response({ event }, 'Event retrieved successfully');
  }

  // ------------------------------ Coming Soon ------------------------------
  async getAllComingSoon(query: any = {}) {
    const { data, meta } = await this.postService.getAllPublic(
      {
        ...query,
        type: 'event',
      },
      {
        startDate: {
          gt: new Date(),
        },
      },
    );

    return this.postService.response(
      {
        events: data.posts,
      },
      'Events retrieved successfully',
      meta,
    );
  }

  // ------------------------------ Event -------------------------------

  private createAsEvent(payload: CreatePostDto) {
    const { startDate, endDate } = this.setEventDate(
      payload.startDate,
      payload.endDate,
    );
    const { youtubeId, slidoId } = this.setEmbededId(
      payload.youtubeId,
      payload.slidoId,
    );

    payload.startDate = startDate;
    payload.endDate = endDate;
    payload.youtubeId = youtubeId;
    payload.slidoId = slidoId;
    payload.type = 'event';
  }

  private setEventDate(startDate: Date, endDate: Date) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Start date cannot be greater than end date',
      );
    }

    return {
      startDate,
      endDate,
    };
  }

  private setEmbededId(youtubeId: string, slidoId: string) {
    if (!youtubeId && !slidoId) {
      throw new BadRequestException('Youtube ID and Slido ID are required');
    }

    return {
      youtubeId,
      slidoId,
    };
  }
}
