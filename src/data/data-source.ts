import { DataSource } from 'typeorm';
import { Token } from '../models/token.entity';
import { Chain } from '../models/chain.entity';
import { Logo } from '../models/logo.entity';
import { InitialMigration1684654321000 } from '../migrations/1684654321000-InitialMigration';
import { FixPriceDecimalPrecision1684654322000 } from '../migrations/1684654322000-FixPriceDecimalPrecision';
import { NormalizeDatabase1684654323000 } from '../migrations/1684654323000-NormalizeDatabase';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'tokens',
  entities: [Token, Chain, Logo],
  migrations: [
    InitialMigration1684654321000,
    FixPriceDecimalPrecision1684654322000,
    NormalizeDatabase1684654323000,
  ],
  synchronize: false, // Set to false when using migrations
  logging: true,
});
