import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PostStatus, PostType } from 'src/type';
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

  @IsEnum(['post', 'event', 'stream'], {
    message: 'Type must be one of these values: post, event, stream',
  })
  @IsOptional()
  type?: PostType;

  @IsString()
  @IsOptional()
  publishedAt?: Date;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  authorId?: number;
}
