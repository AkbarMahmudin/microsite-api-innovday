import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PostStatus } from './post-status';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(
    ['draft', 'published', 'unpublished', 'scheduled', 'private', 'archived'],
    {
      message:
        'Status must be one of these values: draft, published, unpublished, scheduled, private, archived',
    },
  )
  @IsOptional()
  status?: PostStatus;

  @IsString()
  @IsOptional()
  publishedAt?: Date;

  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
