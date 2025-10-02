import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validate } from './config/env.validation';
import { Token } from './models/token.entity';
import { Chain } from './models/chain.entity';
import { Logo } from './models/logo.entity';
import { TokenPriceUpdateService } from './services/token-price-update.service';
import { MockPriceService } from './services/mock-price.service';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { TokenSeeder } from './data/token.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
      validate,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'tokens',
      entities: [Token, Chain, Logo],
      migrations: [__dirname + '/migrations/*.{js,ts}'],
      migrationsRun: true, // Run migrations automatically
      synchronize: false, // Disabled when using migrations
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([Token, Chain, Logo]),
  ],
  controllers: [],
  providers: [TokenPriceUpdateService, MockPriceService, KafkaProducerService, TokenSeeder],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly tokenSeeder: TokenSeeder,
    private readonly tokenPriceUpdateService: TokenPriceUpdateService,
  ) {}

  async onModuleInit() {
    try {
      // Seed initial data
      await this.tokenSeeder.seed();

      // Start price update service
      this.tokenPriceUpdateService.start();
    } catch (error) {
      console.error('Failed to initialize application:', error);
    }
  }
}
