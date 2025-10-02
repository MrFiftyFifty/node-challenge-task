import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../models/token.entity';
import { MockPriceService } from './mock-price.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { createTokenPriceUpdateMessage } from '../models/token-price-update-message';

@Injectable()
export class TokenPriceUpdateService implements OnModuleDestroy {
  private readonly logger = new Logger(TokenPriceUpdateService.name);
  private timer?: NodeJS.Timeout;
  private readonly updateIntervalSeconds: number;
  private isRunning = false;
  private isProcessing = false;
  private shutdownPromise?: Promise<void>;

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly priceService: MockPriceService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    this.updateIntervalSeconds = parseInt(process.env.PRICE_UPDATE_INTERVAL_SECONDS || '5', 10);
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn('Price update service is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log(
      `Starting price update service (interval: ${this.updateIntervalSeconds} seconds)...`,
    );

    this.timer = setInterval(async () => {
      // Prevent overlapping executions
      if (this.isProcessing) {
        this.logger.warn('Previous update still in progress, skipping this iteration');
        return;
      }

      try {
        await this.updatePrices();
      } catch (error) {
        this.logger.error(
          `Error in price update interval: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
    }, this.updateIntervalSeconds * 1000);

    // Trigger an initial update immediately
    this.updatePrices().catch((error: Error) => {
      this.logger.error(`Error in initial price update: ${error.message}`, error.stack);
    });
  }

  private async updatePrices(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const tokens = await this.tokenRepository.find();
      this.logger.log(`Updating prices for ${tokens.length} tokens...`);

      // Process tokens in parallel with Promise.allSettled for better error handling
      const updatePromises = tokens.map(token => this.updateTokenPrice(token));

      const results = await Promise.allSettled(updatePromises);

      // Log failed updates
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warn(`${failures.length} token(s) failed to update`);
        failures.forEach(failure => {
          if (failure.status === 'rejected') {
            this.logger.error(`Failed to update token: ${failure.reason}`);
          }
        });
      }
    } catch (error) {
      this.logger.error(
        `Error updating prices: ${(error as Error).message}`,
        (error as Error).stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async updateTokenPrice(token: Token): Promise<void> {
    const oldPrice = token.price;
    const newPrice = await this.priceService.getRandomPriceForToken();

    if (oldPrice !== newPrice) {
      // Create message for Kafka using Zod helper function
      const message = createTokenPriceUpdateMessage({
        tokenId: token.id,
        symbol: token.symbol || 'UNKNOWN',
        oldPrice,
        newPrice,
        // timestamp will be set to current date by default if not provided
      });

      // Send to Kafka first, then update database
      await this.kafkaProducer.sendPriceUpdateMessage(message);

      // Update token in database
      token.price = newPrice;
      token.lastPriceUpdate = new Date();

      await this.tokenRepository.save(token);
      this.logger.log(`Updated price for ${token.symbol}: ${oldPrice} -> ${newPrice}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Price update service is not running');
      return;
    }

    this.logger.log('Stopping price update service...');
    this.isRunning = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    // Wait for current processing to complete
    if (this.isProcessing) {
      this.logger.log('Waiting for current price update to complete...');
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (this.isProcessing && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (this.isProcessing) {
        this.logger.warn('Forced shutdown after timeout');
      }
    }

    this.logger.log('Price update service stopped');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.shutdownPromise) {
      this.shutdownPromise = this.stop();
    }
    await this.shutdownPromise;
  }
}
