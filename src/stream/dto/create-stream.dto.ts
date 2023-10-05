import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CreatePostDto } from 'src/post/dto';

export class CreateStreamDto extends CreatePostDto {
  @IsString()
  @IsNotEmpty()
  youtubeId: string;

  @IsString()
  @IsNotEmpty()
  slidoId: string;

  @IsString()
  @IsNotEmpty()
  startDate: Date;

  @IsString()
  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsOptional()
  key: string | null;

  @IsObject()
  @IsNotEmpty()
  userStreamIds: {
    speakerId: number;
    moderatorId: number;
  };
}
