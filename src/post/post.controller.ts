import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto';

const FILE_VALIDATION = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1 }), // 5MB
    new FileTypeValidator({
      fileType: /image\/(jpe?g|png|webp)$/i,
    }),
  ],
  fileIsRequired: false,
});

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() payload: CreatePostDto,
    @UploadedFile(FILE_VALIDATION)
    thumbnail: Express.Multer.File,
  ) {
    return await this.postService.create(
      {
        ...payload,
      },
      thumbnail,
    );
  }

  @Get()
  async getAll(@Query() query: any = {}) {
    return await this.postService.getAll(query);
  }

  @Get(':idorSlug')
  async getOne(@Param('idorSlug') idorSlug: string | number) {
    return await this.postService.getOne(idorSlug);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePostDto,
    @UploadedFile(FILE_VALIDATION) thumbnail: Express.Multer.File,
  ) {
    return await this.postService.update(id, payload, thumbnail);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.postService.delete(id);
  }

  @Get('thumbnail/:thumbnail')
  async serveThumbnail(@Param('thumbnail') thumbnail: string) {
    return await this.postService.getPostThumbnail(thumbnail);
  }
}
