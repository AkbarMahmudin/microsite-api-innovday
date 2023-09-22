import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(payload: AuthDto) {
    const { email, password } = payload;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new ForbiddenException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ForbiddenException('Invalid credentials');
    delete user.password;

    return {
      error: false,
      message: 'Login successfully',
      data: {
        access_token: await this.signToken(user.id, user.email),
      },
    };
  }

  private async signToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET_KEY');
    const expiresIn = this.config.get('JWT_EXPIRES_IN') ?? '1d';

    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }
}
