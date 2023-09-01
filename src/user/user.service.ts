import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdatePasswordDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  private queryOptions = {};

  constructor(private prisma: PrismaService) {}

  async create(payload: CreateUserDto) {
    try {
      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(payload.password, salt);
      const userCreated = await this.prisma.user.create({
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        data: payload,
      });

      return this.response(
        {
          user: userCreated,
        },
        'User created successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getAll(query: any = {}) {
    const { name, email, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    this.searchByNameOrEmail(name, email);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      where: {
        ...this.queryOptions,
      },
      skip: offset,
      take: limit,
    });
    const count = await this.prisma.user.count();
    const totalPages = Math.ceil(count / limit);
    const meta = {
      page: Number(page),
      limit: Number(limit),
      total_data_per_page: users.length,
      total_data: count,
      total_pages: totalPages,
    };

    this.queryOptions = {};
    return this.response({ users }, 'Users retrieved successfully', meta);
  }

  async getOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return this.response({ user }, 'User retrieved successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async update(id: number, payload: UpdateUserDto) {
    try {
      const userUpdated = await this.prisma.user.update({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
        where: { id },
        data: payload,
      });

      return this.response({ user: userUpdated }, 'User updated successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number) {
    try {
      const userDeleted = await this.prisma.user.delete({
        where: { id },
      });

      return this.response(
        {
          user_id: userDeleted.id,
        },
        'User deleted successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async updatePassword(id: number, payload: UpdatePasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!bcrypt.compareSync(payload.currentPassword, user.password)) {
        throw new BadRequestException('Current password is incorrect');
      }

      const salt = await bcrypt.genSalt(10);
      payload.newPassword = await bcrypt.hash(payload.newPassword, salt);

      const userUpdated = await this.prisma.user.update({
        where: { id },
        data: { password: payload.newPassword },
      });

      return this.response(
        { user_id: userUpdated.id },
        'Password updated successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  // ---------------------- Other CRUD ----------------------

  private searchByNameOrEmail(name, email) {
    if (!name && !email) return this;

    this.queryOptions = {
      ...this.queryOptions,
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(email && { email: { contains: email, mode: 'insensitive' } }),
    };

    return this;
  }

  private response(data: any, message: string, meta?: any) {
    return {
      error: false,
      message,
      data: {
        ...data,
      },
      meta,
    };
  }
}
