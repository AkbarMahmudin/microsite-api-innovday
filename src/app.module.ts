import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseModule } from '@nhogs/nestjs-firebase';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { CategoryModule } from './category/category.module';
import { MediaModule } from './media/media.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    PrismaModule,
    PostModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    FirebaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.get('FIREBASE_API_KEY'),
        authDomain: config.get('FIREBASE_AUTH_DOMAIN'),
        projectId: config.get('FIREBASE_PROJECT_ID'),
        storageBucket: config.get('FIREBASE_STORAGE_BUCKET'),
      }),
    }),
    CategoryModule,
    MediaModule,
    UserModule,
    RoleModule,
    EventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
