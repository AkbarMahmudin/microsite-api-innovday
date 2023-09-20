import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  async paginate({
    model,
    page,
    limit,
  }: {
    model: string;
    page: number;
    limit: number;
  }) {
    const total = await this[model].count();
    const totalPages = Math.ceil(total / limit);

    return {
      page: Number(page),
      limit: Number(limit),
      total_data: total,
      total_page: totalPages,
    };
  }

  prismaError(err: any) {
    const errors: any = {
      P2002: () => {
        throw new BadRequestException(err.meta.target[0] + ' is already taken');
      },
      P2003: () => {
        throw new BadRequestException(err.meta['field_name'] + ' not found');
      },
      P2025: () => {
        throw new NotFoundException(err.meta.cause);
      },
      P2026: () => {
        throw new BadRequestException(err.meta.cause);
      },
    };

    if (errors[err.code]) {
      errors[err.code]();
    } else {
      throw new BadRequestException(err.message);
    }
  }
}
