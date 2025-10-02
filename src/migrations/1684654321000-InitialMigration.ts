import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1684654321000 implements MigrationInterface {
  name = 'InitialMigration1684654321000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "address" bytea NOT NULL,
                "symbol" character varying,
                "name" character varying,
                "decimals" smallint NOT NULL DEFAULT '0',
                "isNative" boolean NOT NULL DEFAULT false,
                "chainId" uuid NOT NULL,
                "isProtected" boolean NOT NULL DEFAULT false,
                "lastUpdateAuthor" character varying,
                "priority" integer NOT NULL DEFAULT '0',
                "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "chain_id" uuid NOT NULL,
                "chain_deid" numeric NOT NULL,
                "chain_name" character varying NOT NULL,
                "chain_isenabled" boolean NOT NULL DEFAULT true,
                "logo_id" uuid NOT NULL,
                "logo_tokenid" uuid,
                "logo_bigrelativepath" character varying NOT NULL,
                "logo_smallrelativepath" character varying NOT NULL,
                "logo_thumbrelativepath" character varying NOT NULL,
                "price" numeric(28,0) NOT NULL DEFAULT '0',
                "lastPriceUpdate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_tokens" PRIMARY KEY ("id")
            )
        `);

    // Create extension for UUID generation if it doesn't exist
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tokens"`);
  }
}
