import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Chain } from './chain.entity';
import { Logo } from './logo.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bytea' })
  address!: Buffer;

  @Column({ nullable: true })
  symbol!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ type: 'smallint', default: 0 })
  decimals!: number;

  @Column({ default: false })
  isNative!: boolean;

  @Column({ type: 'uuid' })
  chainId!: string;

  @Column({ default: false })
  isProtected!: boolean;

  @Column({ nullable: true })
  lastUpdateAuthor!: string | null;

  @Column({ default: 0 })
  priority!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;

  // Normalized relationships
  @ManyToOne(() => Chain, chain => chain.tokens, { eager: true })
  @JoinColumn({ name: 'chainId' })
  chain!: Chain;

  @Column({ type: 'uuid', nullable: true })
  logoId!: string | null;

  @OneToOne(() => Logo, logo => logo.token, { eager: true, nullable: true })
  @JoinColumn({ name: 'logoId' })
  logo!: Logo | null;

  @Column({
    type: 'decimal',
    precision: 28,
    scale: 18,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastPriceUpdate!: Date;
}
