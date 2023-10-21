import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto';

@Injectable()
export class RoleService {
  private queryOptions = {};
  constructor(private prisma: PrismaService) {}

  async create(payload: CreateRoleDto) {
    try {
      payload.name = payload.name.toLowerCase();

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

      const skipTake =
        limit === '*'
          ? undefined
          : { skip: Number(offset), take: Number(limit) };

      const [roles, count] = await this.prisma.$transaction([
        this.prisma.role.findMany({
          ...skipTake,
          where: {
            ...this.queryOptions,
          },
          ...this.sortBy(query.sort),
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

      this.queryOptions = {};

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

  async deleteMany(ids: number[]) {
    try {
      if (!ids || !ids.length) {
        throw new BadRequestException('Please provide at least one id');
      }

      await this.prisma.role.deleteMany({
        where: { id: { in: ids } },
      });

      return this.response({ role_ids: ids }, 'Roles deleted successfully');
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

  private sortBy(
    queryOrder: { [key: string]: string } = {
      createdAt: 'desc',
    },
  ) {
    const field = Object.keys(queryOrder)[0] || 'createdAt';
    const sort = queryOrder[field].toLowerCase() || 'desc';

    return {
      orderBy: {
        [field]: sort,
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
