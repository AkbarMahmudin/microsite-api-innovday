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
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Post()
  async create(@Body() payload: CreatePostDto) {
    console.log({ payload });

    return await this.postService.create(payload);
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
}
