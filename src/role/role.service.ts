import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto';

@Injectable()
export class RoleService {
  private queryOptions = {};
  constructor(private prisma: PrismaService) {}

  async create(payload: CreateRoleDto) {
    try {
      const roleCreated = await this.prisma.role.create({
        data: payload,
      });

      return this.response({ role: roleCreated }, 'Role created successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getAll(query: any = {}) {
    try {
      const { name, page = 1, limit = 10 } = query;

      const offset = (page - 1) * limit;
      this.searchByName(name);

      const [roles, count] = await this.prisma.$transaction([
        this.prisma.role.findMany({
          skip: Number(offset),
          take: Number(limit),
          where: {
            ...this.queryOptions,
          },
        }),
        this.prisma.role.count({
          where: {
            ...this.queryOptions,
          },
        }),
      ]);

      // metadata
      const meta = {
        ...(await this.prisma.paginate({
          count,
          page,
          limit,
        })),
        total_data_per_page: roles.length,
      };

      return this.response({ roles }, 'Roles retrieved successfully', meta);
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async getOne(id: number) {
    try {
      const role = await this.prisma.role.findUnique({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        where: { id },
      });

      if (!role) throw new NotFoundException('Role not found');

      return this.response({ role }, 'Role retrieved successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async update(id: number, payload: CreateRoleDto) {
    try {
      const roleUpdated = await this.prisma.role.update({
        where: { id },
        data: payload,
      });

      return this.response({ role: roleUpdated }, 'Role updated successfully');
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  async delete(id: number) {
    try {
      const roleDeleted = await this.prisma.role.delete({
        where: { id },
      });

      return this.response(
        { role_id: roleDeleted.id },
        'Role deleted successfully',
      );
    } catch (err) {
      if (err.code) {
        this.prisma.prismaError(err);
      }
      throw err;
    }
  }

  // ------------------ Other CRUD ------------------

  private searchByName(name: string) {
    if (!name) return this;

    this.queryOptions = {
      ...this.queryOptions,
      name: {
        contains: name,
        mode: 'insensitive',
      },
    };
  }

  private response(data: any, message: string, meta?: any) {
    return {
      error: false,
      message,
      data,
      meta,
    };
  }
}
