import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PostService } from 'src/post/post.service';

@Module({
  providers: [EventService, PostService],
  controllers: [EventController],
})
export class EventModule {}
