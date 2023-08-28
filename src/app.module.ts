import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { CategoryModule } from './category/category.module';
import { FirebaseModule } from '@nhogs/nestjs-firebase';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    PrismaModule,
    PostModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    FirebaseModule.forRoot({
      apiKey: 'AIzaSyBm0mIutRWA1vfsE-YAQcmlRBN8Y6eGu90',
      authDomain: 'microsite-test-f4d9e.firebaseapp.com',
      projectId: 'microsite-test-f4d9e',
      storageBucket: 'microsite-test-f4d9e.appspot.com',
    }),
    CategoryModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
