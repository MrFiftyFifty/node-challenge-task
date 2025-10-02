import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main');
  logger.log('Starting Token Price Service...');

  try {
    const app = await NestFactory.create(AppModule);

    // Enable graceful shutdown
    app.enableShutdownHooks();

    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen(port);
    logger.log(`Service is running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start application', (error as Error).stack);
    process.exit(1);
  }
}

bootstrap();
