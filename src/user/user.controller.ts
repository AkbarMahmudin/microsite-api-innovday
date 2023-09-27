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
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdatePasswordDto, UpdateUserDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/interface/role.enum';
import { Request } from 'express';

@UseGuards(JwtGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getMe(@Req() req: Request, @Query() query: any) {
    const userId = req['user']['sub'];
    return await this.userService.getMe(userId, query);
  }

  @Patch('me')
  async updateMe(@Req() req: Request, @Body() payload: UpdateUserDto) {
    const userId = req['user']['sub'];

    return await this.userService.updateMe(userId, payload);
  }

  @Patch('me/new-password')
  async updatePassword(
    @Req() req: Request,
    @Body() payload: UpdatePasswordDto,
  ) {
    const userId = req['user']['sub'];
    return await this.userService.updatePassword(userId, payload);
  }

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() payload: CreateUserDto) {
    return await this.userService.create(payload);
  }

  @Roles(Role.ADMIN)
  @Get()
  async getAll(@Query() query: any) {
    return await this.userService.getAll(query);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
  ) {
    return await this.userService.update(id, payload);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.delete(id);
  }
}
