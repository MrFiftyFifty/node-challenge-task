export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  topic: string;
}

export interface ApplicationConfig {
  port: number;
  nodeEnv: string;
  priceUpdateIntervalSeconds: number;
}

export interface AppConfiguration {
  database: DatabaseConfig;
  kafka: KafkaConfig;
  application: ApplicationConfig;
}

export function configuration(): AppConfiguration {
  return {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'tokens',
    },
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'token-price-service',
      topic: process.env.KAFKA_TOPIC || 'token-price-updates',
    },
    application: {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      priceUpdateIntervalSeconds: parseInt(process.env.PRICE_UPDATE_INTERVAL_SECONDS || '5', 10),
    },
  };
}
