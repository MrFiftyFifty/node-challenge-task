import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPriceDecimalPrecision1684654322000 implements MigrationInterface {
  name = 'FixPriceDecimalPrecision1684654322000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change price column to support decimal values with proper precision
    // Using numeric(28,18) to support crypto prices with many decimal places
    await queryRunner.query(`
            ALTER TABLE "tokens" 
            ALTER COLUMN "price" TYPE numeric(28,18) USING price::numeric(28,18)
        `);

    // Add index on price for better query performance
    await queryRunner.query(`
            CREATE INDEX "IDX_tokens_price" ON "tokens" ("price")
        `);

    // Add indexes on frequently queried columns
    await queryRunner.query(`
            CREATE INDEX "IDX_tokens_symbol" ON "tokens" ("symbol")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_tokens_chainId" ON "tokens" ("chainId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_tokens_address" ON "tokens" ("address")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tokens_address"`);
    await queryRunner.query(`DROP INDEX "IDX_tokens_chainId"`);
    await queryRunner.query(`DROP INDEX "IDX_tokens_symbol"`);
    await queryRunner.query(`DROP INDEX "IDX_tokens_price"`);

    await queryRunner.query(`
            ALTER TABLE "tokens" 
            ALTER COLUMN "price" TYPE numeric(28,0)
        `);
  }
}
