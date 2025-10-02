import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  // Database
  @IsString()
  @IsOptional()
  DB_HOST = 'localhost';

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT = 5432;

  @IsString()
  @IsOptional()
  DB_USERNAME = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD = 'postgres';

  @IsString()
  @IsOptional()
  DB_DATABASE = 'tokens';

  // Kafka
  @IsString()
  @IsOptional()
  KAFKA_BROKERS = 'localhost:9092';

  @IsString()
  @IsOptional()
  KAFKA_CLIENT_ID = 'token-price-service';

  @IsString()
  @IsOptional()
  KAFKA_TOPIC = 'token-price-updates';

  // Application
  @IsNumber()
  @Min(1)
  @Max(3600)
  @IsOptional()
  PRICE_UPDATE_INTERVAL_SECONDS = 5;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
