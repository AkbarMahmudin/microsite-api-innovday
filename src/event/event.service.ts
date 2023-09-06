import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from 'src/post/dto';
import { PostService } from 'src/post/post.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private postService: PostService,
  ) {}

  async create(payload: CreatePostDto, thumbnail?: Express.Multer.File) {
    try {
      this.createAsEvent(payload);

      const { post: eventCreated } = (
        await this.postService.create(
          {
            ...payload,
            type: 'event',
          },
          thumbnail,
        )
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
    const type = 'event';

    const { data, meta } = await this.postService.getAll({
      ...query,
      type,
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
    if (isNaN(Number(idorSlug))) {
      return await this.getOneBySlug(idorSlug as string);
    }

    return await this.getOneById(Number(idorSlug));
  }

  async getOneBySlug(slug: string) {
    const type = 'event';

    const event = await this.prisma.post.findFirst({
      where: {
        type,
        slug,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.postService.response({ event }, 'Event retrieved successfully');
  }

  async getOneById(id: number) {
    const type = 'event';

    const event = await this.prisma.post.findFirst({
      where: {
        type,
        id,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.postService.response({ event }, 'Event retrieved successfully');
  }

  async update(
    id: number,
    payload: UpdatePostDto,
    thumbnail?: Express.Multer.File,
  ) {
    try {
      const { post: eventUpdated } = (
        await this.postService.update(
          id,
          {
            ...payload,
          },
          thumbnail,
          {
            type: 'event',
          },
        )
      ).data;

      return this.postService.response(
        { event: eventUpdated },
        'Event updated successfully',
      );
    } catch (err) {
      err.code && this.prisma.prismaError(err);
      throw err;
    }
  }

  async delete(id: number) {
    try {
      const { post_id: event_id } = (
        await this.postService.delete(id, {
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
