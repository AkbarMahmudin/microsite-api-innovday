import { IsNotEmpty, IsString } from 'class-validator';

export class CategoryDto {
  @IsString({ each: true })
  @IsNotEmpty()
  name: string | string[];
}
