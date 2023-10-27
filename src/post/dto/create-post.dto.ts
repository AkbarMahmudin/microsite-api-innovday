import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus, PostType } from 'src/type';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['draft', 'published', 'scheduled', 'private', 'archived'], {
    message:
      'Status must be one of these values: draft, published, scheduled, private, archived',
  })
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
  @IsNotEmpty()
  @Type(() => Number)
  categoryId: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  authorId: number;

  // Metadata for SEO
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  metaKeywords?: string;
}
