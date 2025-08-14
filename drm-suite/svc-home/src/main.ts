import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS設定
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger設定
  const config = new DocumentBuilder()
    .setTitle('DRM Suite Home Service')
    .setDescription('Home dashboard and role-based features API')
    .setVersion('1.0')
    .addTag('home')
    .addTag('home-stubs')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // グローバルプレフィックス
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Home service is running on: http://localhost:${port}`);
  console.log(`API docs available at: http://localhost:${port}/api-docs`);
}
bootstrap();