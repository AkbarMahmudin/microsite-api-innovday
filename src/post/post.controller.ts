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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { Request } from 'express';

const FILE_VALIDATION = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
    new FileTypeValidator({
      fileType: /image\/(jpe?g|png|webp)$/i,
    }),
  ],
  fileIsRequired: false,
});

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @UseGuards(JwtGuard)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() payload: CreatePostDto,
    @UploadedFile(FILE_VALIDATION)
    thumbnail: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = req['user']['sub'];

    return await this.postService.create(
      userId,
      {
        ...payload,
      },
      thumbnail,
    );
  }

  @UseGuards(JwtGuard)
  @Get()
  async getAll(@Query() query: any = {}) {
    return await this.postService.getAll(query);
  }

  // Get all posts for public user
  @Get('public')
  async getAllPublic(@Query() query: any = {}) {
    return await this.postService.getAllPublic(query);
  }

  @Get(':idorSlug/public')
  async getOnePublic(@Param('idorSlug') idorSlug: string | number) {
    return await this.postService.getOnePublic(idorSlug);
  }

  @UseGuards(JwtGuard)
  @Get(':idorSlug')
  async getOne(@Param('idorSlug') idorSlug: string | number) {
    return await this.postService.getOne(idorSlug);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePostDto,
    @UploadedFile(FILE_VALIDATION) thumbnail: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = req['user']['sub'];

    return await this.postService.update(id, userId, payload, thumbnail);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req['user']['sub'];

    return await this.postService.delete(id, userId);
  }

  @UseGuards(JwtGuard)
  @Delete()
  async deleteMany(@Body() payload: { ids: number[] }, @Req() req: Request) {
    const userId = req['user']['sub'];

    return await this.postService.deleteMany(payload.ids, userId);
  }
}
