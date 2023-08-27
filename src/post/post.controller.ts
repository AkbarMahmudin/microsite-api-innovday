import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    return cb(null, `${randomName}${file.originalname}`);
  },
});

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage,
    }),
  )
  async create(
    @Body() payload: CreatePostDto,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    return await this.postService.create({
      ...payload,
      ...(payload.thumbnail && { thumbnail: thumbnail.filename }),
    });
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePostDto,
  ) {
    return await this.postService.update(id, payload);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.postService.delete(id);
  }

  @Get('thumbnail/:thumbnail')
  async serveThumbnail(@Param('thumbnail') thumbnail: string, @Res() res) {
    return res.sendFile(join(process.cwd(), 'uploads', thumbnail));
  }
}
