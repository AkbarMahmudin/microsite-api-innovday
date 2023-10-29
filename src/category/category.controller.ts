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
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/interface/role.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Roles(Role.ADMIN, Role.AUTHOR)
  @UseGuards(JwtGuard, RolesGuard)
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

  @Roles(Role.ADMIN, Role.AUTHOR)
  @UseGuards(JwtGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: { name: string },
  ) {
    return this.categoryService.update(id, payload);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delete(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtGuard, RolesGuard)
  @Delete()
  async deleteMany(@Body() payload: { ids: number[] }) {
    return this.categoryService.deleteMany(payload.ids);
  }
}
