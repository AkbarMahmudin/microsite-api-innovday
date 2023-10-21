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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/interface/role.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Roles(Role.ADMIN)
@UseGuards(JwtGuard, RolesGuard)
@Controller('roles')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Post()
  async create(@Body() payload: CreateRoleDto) {
    return this.roleService.create(payload);
  }

  @Get()
  async getAll(@Query() query: any) {
    return this.roleService.getAll(query);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.getOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateRoleDto,
  ) {
    return this.roleService.update(id, payload);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(id);
  }

  @Delete()
  async deleteMany(@Body('ids') ids: number[]) {
    return this.roleService.deleteMany(ids);
  }
}
