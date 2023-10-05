import { IsObject, IsOptional, IsString } from 'class-validator';
import { UpdatePostDto } from 'src/post/dto';

export class UpdateStreamDto extends UpdatePostDto {
  @IsString()
  @IsOptional()
  youtubeId?: string;

  @IsString()
  @IsOptional()
  slidoId?: string;

  @IsString()
  @IsOptional()
  startDate?: Date;

  @IsString()
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  key?: string | null;

  @IsObject()
  @IsOptional()
  userStreamIds?: {
    speakerId: number;
    moderatorId: number;
  };
}
