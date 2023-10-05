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
import { StreamService } from './stream.service';
import { CreateStreamDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { UpdateStreamDto } from './dto/update-stream.dto';

const FILE_VALIDATION = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
    new FileTypeValidator({
      fileType: /image\/(jpe?g|png|webp)$/i,
    }),
  ],
  fileIsRequired: false,
});

@Controller('streams')
export class StreamController {
  constructor(private streamService: StreamService) {}

  /**
   * ----------------------------
   * PUBLIC ROUTES
   * ----------------------------
   */
  @Get('public')
  async getAllPublic(@Query() query: any = {}) {
    return await this.streamService.getAllPublic(query);
  }

  @Get(':idorslug/public')
  async getOnePublic(@Param('idorslug') id: number | string) {
    return await this.streamService.getOnePublic(id);
  }

  @Get(':idorslug/public/related')
  async getRelatedPublic(@Param('idorslug') id: number | string) {
    return await this.streamService.getRelatedPublic(id);
  }

  @Get('coming-soon')
  async getComingSoons() {
    return await this.streamService.getComingSoons();
  }

  @Get('live')
  async getLives() {
    return await this.streamService.getLives();
  }

  /**
   * ----------------------------
   * PRIVATE ROUTES
   * ----------------------------
   */
  @Get('private')
  async getOnePrivate(@Query() query: any = {}) {
    return await this.streamService.getOnePrivate(query);
  }

  /**
   * ----------------------------
   * PROTECTED ROUTES
   * ----------------------------
   */

  @UseGuards(JwtGuard)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() payload: CreateStreamDto,
    @UploadedFile(FILE_VALIDATION)
    thumbnail: Express.Multer.File,
    @Req() req: Request,
  ) {
    payload.authorId = req['user']['sub'];

    return await this.streamService.create(payload, thumbnail);
  }

  @UseGuards(JwtGuard)
  @Get()
  async getAll(@Query() query: any = {}) {
    return await this.streamService.getAll(query);
  }

  @UseGuards(JwtGuard)
  @Get(':idorslug')
  async getOne(@Param('idorslug') id: number | string) {
    return await this.streamService.getOne(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateStreamDto,
    @UploadedFile(FILE_VALIDATION)
    thumbnail: Express.Multer.File,
    @Req() req: Request,
  ) {
    payload.authorId = req['user']['sub'];

    return await this.streamService.update(id, payload, thumbnail);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authorId = req['user']['sub'];
    return await this.streamService.delete(id, authorId);
  }

  @UseGuards(JwtGuard)
  @Delete()
  async deleteMany(@Body() payload: { ids: number[] }, @Req() req: Request) {
    const authorId = req['user']['sub'];
    return await this.streamService.deleteMany(payload.ids, authorId);
  }
}
