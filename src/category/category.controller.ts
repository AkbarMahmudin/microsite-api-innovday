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
import { CategoryService } from './category.service';
import { CategoryDto } from './dto';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  async create(@Body() payload: CategoryDto) {
    return this.categoryService.create(payload);
  }

  @Get()
  async getAll(@Query() query: any) {
    return this.categoryService.getAll(query);
  }

  @Get(':idorslug')
  async getOne(@Param('idorslug') idorslug: string) {
    return this.categoryService.getOne(idorslug);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: { name: string },
  ) {
    return this.categoryService.update(id, payload);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delete(id);
  }
}
