import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  app.useGlobalPipes(new ValidationPipe()); // 👈 validation pipe
  app.enableCors(); // 👈 enable cors
  await app.listen(3000);
}
bootstrap();
