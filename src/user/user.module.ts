import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PostService } from 'src/post/post.service';

@Module({
  providers: [UserService, PostService],
  controllers: [UserController],
})
export class UserModule {}
