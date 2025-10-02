import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Token } from '../models/token.entity';
import { Chain } from '../models/chain.entity';
import { Logo } from '../models/logo.entity';

@Injectable()
export class TokenSeeder {
  private readonly logger = new Logger(TokenSeeder.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Chain)
    private readonly chainRepository: Repository<Chain>,
    @InjectRepository(Logo)
    private readonly logoRepository: Repository<Logo>,
  ) {}

  async seed(): Promise<void> {
    // Check if there are already tokens in the database
    const count = await this.tokenRepository.count();
    if (count > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding initial data...');

    try {
      // Create chains
      const ethereumChain = this.chainRepository.create({
        id: '11111111-1111-1111-1111-111111111111',
        deId: 1,
        name: 'Ethereum',
        isEnabled: true,
      });

      const bitcoinChain = this.chainRepository.create({
        id: '22222222-2222-2222-2222-222222222222',
        deId: 2,
        name: 'Bitcoin',
        isEnabled: true,
      });

      const solanaChain = this.chainRepository.create({
        id: '33333333-3333-3333-3333-333333333333',
        deId: 3,
        name: 'Solana',
        isEnabled: true,
      });

      await this.chainRepository.save([ethereumChain, bitcoinChain, solanaChain]);
      this.logger.log('Chains created successfully');

      // Create logos
      const ethLogo = this.logoRepository.create({
        id: randomUUID(),
        tokenId: null,
        bigRelativePath: '/images/eth_big.png',
        smallRelativePath: '/images/eth_small.png',
        thumbRelativePath: '/images/eth_thumb.png',
      });

      const btcLogo = this.logoRepository.create({
        id: randomUUID(),
        tokenId: null,
        bigRelativePath: '/images/btc_big.png',
        smallRelativePath: '/images/btc_small.png',
        thumbRelativePath: '/images/btc_thumb.png',
      });

      const solLogo = this.logoRepository.create({
        id: randomUUID(),
        tokenId: null,
        bigRelativePath: '/images/sol_big.png',
        smallRelativePath: '/images/sol_small.png',
        thumbRelativePath: '/images/sol_thumb.png',
      });

      await this.logoRepository.save([ethLogo, btcLogo, solLogo]);
      this.logger.log('Logos created successfully');

      // Define token data
      const tokenData = [
        {
          address: Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]),
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          isNative: true,
          chainId: ethereumChain.id,
          logoId: ethLogo.id,
          isProtected: true,
          lastUpdateAuthor: 'Seeder',
          priority: 1,
          timestamp: new Date(),
          price: 300000,
          lastPriceUpdate: new Date(),
        },
        {
          address: Buffer.from([0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19]),
          symbol: 'BTC',
          name: 'Bitcoin',
          decimals: 8,
          isNative: true,
          chainId: bitcoinChain.id,
          logoId: btcLogo.id,
          isProtected: true,
          lastUpdateAuthor: 'Seeder',
          priority: 2,
          timestamp: new Date(),
          price: 4500000,
          lastPriceUpdate: new Date(),
        },
        {
          address: Buffer.from([0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29]),
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          isNative: true,
          chainId: solanaChain.id,
          logoId: solLogo.id,
          isProtected: true,
          lastUpdateAuthor: 'Seeder',
          priority: 3,
          timestamp: new Date(),
          price: 15000,
          lastPriceUpdate: new Date(),
        },
      ];

      // Save tokens
      await this.tokenRepository.save(tokenData);
      this.logger.log('Tokens created successfully');
      this.logger.log('Initial data seeded successfully');
    } catch (error) {
      this.logger.error('Failed to seed initial data', (error as Error).stack);
      throw error;
    }
  }
}
