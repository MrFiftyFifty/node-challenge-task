import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeDatabase1684654323000 implements MigrationInterface {
  name = 'NormalizeDatabase1684654323000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chains table
    await queryRunner.query(`
            CREATE TABLE "chains" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "deId" numeric NOT NULL,
                "name" character varying NOT NULL,
                "isEnabled" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_chains_deId" UNIQUE ("deId"),
                CONSTRAINT "PK_chains" PRIMARY KEY ("id")
            )
        `);

    // Create logos table
    await queryRunner.query(`
            CREATE TABLE "logos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tokenId" uuid,
                "bigRelativePath" character varying NOT NULL,
                "smallRelativePath" character varying NOT NULL,
                "thumbRelativePath" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_logos" PRIMARY KEY ("id")
            )
        `);

    // Migrate data from denormalized tokens table to chains table
    await queryRunner.query(`
            INSERT INTO "chains" ("id", "deId", "name", "isEnabled")
            SELECT DISTINCT "chain_id", "chain_deid", "chain_name", "chain_isenabled"
            FROM "tokens"
        `);

    // Migrate data from denormalized tokens table to logos table
    await queryRunner.query(`
            INSERT INTO "logos" ("id", "tokenId", "bigRelativePath", "smallRelativePath", "thumbRelativePath")
            SELECT "logo_id", "logo_tokenid", "logo_bigrelativepath", "logo_smallrelativepath", "logo_thumbrelativepath"
            FROM "tokens"
        `);

    // Add logoId column to tokens table
    await queryRunner.query(`
            ALTER TABLE "tokens"
            ADD COLUMN "logoId" uuid
        `);

    // Update logoId in tokens table
    await queryRunner.query(`
            UPDATE "tokens"
            SET "logoId" = "logo_id"
        `);

    // Drop old denormalized columns from tokens table
    await queryRunner.query(`
            ALTER TABLE "tokens"
            DROP COLUMN "chain_id",
            DROP COLUMN "chain_deid",
            DROP COLUMN "chain_name",
            DROP COLUMN "chain_isenabled",
            DROP COLUMN "logo_id",
            DROP COLUMN "logo_tokenid",
            DROP COLUMN "logo_bigrelativepath",
            DROP COLUMN "logo_smallrelativepath",
            DROP COLUMN "logo_thumbrelativepath"
        `);

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "tokens"
            ADD CONSTRAINT "FK_tokens_chainId" 
            FOREIGN KEY ("chainId") 
            REFERENCES "chains"("id") 
            ON DELETE RESTRICT 
            ON UPDATE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "tokens"
            ADD CONSTRAINT "FK_tokens_logoId" 
            FOREIGN KEY ("logoId") 
            REFERENCES "logos"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE
        `);

    // Create indexes for foreign keys
    await queryRunner.query(`
            CREATE INDEX "IDX_tokens_chainId" ON "tokens" ("chainId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_tokens_logoId" ON "tokens" ("logoId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_tokens_logoId"`);
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_tokens_chainId"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_tokens_logoId"`);
    await queryRunner.query(`DROP INDEX "IDX_tokens_chainId"`);

    // Re-add denormalized columns
    await queryRunner.query(`
            ALTER TABLE "tokens"
            ADD COLUMN "chain_id" uuid,
            ADD COLUMN "chain_deid" numeric,
            ADD COLUMN "chain_name" character varying,
            ADD COLUMN "chain_isenabled" boolean DEFAULT true,
            ADD COLUMN "logo_id" uuid,
            ADD COLUMN "logo_tokenid" uuid,
            ADD COLUMN "logo_bigrelativepath" character varying,
            ADD COLUMN "logo_smallrelativepath" character varying,
            ADD COLUMN "logo_thumbrelativepath" character varying
        `);

    // Restore denormalized data
    await queryRunner.query(`
            UPDATE "tokens" t
            SET 
                "chain_id" = c."id",
                "chain_deid" = c."deId",
                "chain_name" = c."name",
                "chain_isenabled" = c."isEnabled"
            FROM "chains" c
            WHERE t."chainId" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "tokens" t
            SET 
                "logo_id" = l."id",
                "logo_tokenid" = l."tokenId",
                "logo_bigrelativepath" = l."bigRelativePath",
                "logo_smallrelativepath" = l."smallRelativePath",
                "logo_thumbrelativepath" = l."thumbRelativePath"
            FROM "logos" l
            WHERE t."logoId" = l."id"
        `);

    // Drop logoId column
    await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "logoId"`);

    // Drop normalized tables
    await queryRunner.query(`DROP TABLE "logos"`);
    await queryRunner.query(`DROP TABLE "chains"`);
  }
}
