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
import { EventService } from './event.service';
import { CreatePostDto, UpdatePostDto } from 'src/post/dto';
import { FileInterceptor } from '@nestjs/platform-express';

const FILE_VALIDATION = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
    new FileTypeValidator({
      fileType: /image\/(jpe?g|png|webp)$/i,
    }),
  ],
  fileIsRequired: false,
});

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() payload: CreatePostDto,
    @UploadedFile(FILE_VALIDATION)
    thumbnail: Express.Multer.File,
  ) {
    return await this.eventService.create(
      {
        ...payload,
      },
      thumbnail,
    );
  }

  @Get()
  async getAll(@Query() query: any) {
    return await this.eventService.getAll(query);
  }

  @Get(':idorSlug')
  async get(@Param('idorSlug') idorSlug: string | number) {
    return await this.eventService.getOne(idorSlug);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePostDto,
    @UploadedFile(FILE_VALIDATION)
    thumbnail: Express.Multer.File,
  ) {
    return await this.eventService.update(id, payload, thumbnail);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.eventService.delete(id);
  }
}
