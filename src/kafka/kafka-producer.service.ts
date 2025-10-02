import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import {
  TokenPriceUpdateMessage,
  tokenPriceUpdateMessageSchema,
} from '../models/token-price-update-message';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly producer: Producer;
  private readonly topic: string;
  private isConnected = false;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'token-price-service';
    this.topic = process.env.KAFKA_TOPIC || 'token-price-updates';

    const kafka = new Kafka({
      clientId,
      brokers,
    });

    this.producer = kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', (error as Error).stack);
      throw error;
    }
  }

  async sendPriceUpdateMessage(message: TokenPriceUpdateMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    // Validate the message with Zod schema
    tokenPriceUpdateMessageSchema.parse(message);

    const value = JSON.stringify(message);

    await this.sendWithRetry(message.tokenId, value);
    this.logger.log(`Sent message to Kafka: ${value}`);
  }

  private async sendWithRetry(key: string, value: string, attempt = 1): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key,
            value,
          },
        ],
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(
        `Error sending message (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`,
      );

      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        this.logger.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(key, value, attempt + 1);
      }

      // Max retries reached, throw error
      throw new Error(`Failed to send message after ${this.maxRetries} attempts: ${errorMessage}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isConnected) {
      this.logger.log('Kafka producer was not connected, skipping disconnect');
      return;
    }

    this.logger.log('Disconnecting from Kafka...');

    try {
      // Gracefully disconnect with timeout
      await Promise.race([
        this.producer.disconnect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Kafka disconnect timeout')), 10000),
        ),
      ]);

      this.isConnected = false;
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka', (error as Error).stack);
      // Force disconnect anyway
      this.isConnected = false;
    }
  }
}
