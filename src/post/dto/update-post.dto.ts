import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PostStatus } from './post-status';
import { Type } from 'class-transformer';

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

  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(['post', 'event'], {
    message: 'Type must be one of these values: post, event',
  })
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  startDate?: Date;

  @IsString()
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  youtubeId?: string;

  @IsString()
  @IsOptional()
  slidoId?: string;

  @IsString()
  @IsOptional()
  publishedAt?: Date;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsString()
  @IsOptional()
  keyPost?: string;
}
