import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PostStatus } from './post-status';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

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
  @IsNotEmpty()
  categoryId: number;
}
