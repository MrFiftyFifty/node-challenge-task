import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Token } from './token.entity';

@Entity('chains')
export class Chain {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', unique: true })
  deId!: number;

  @Column()
  name!: string;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @OneToMany(() => Token, token => token.chain)
  tokens!: Token[];
}
