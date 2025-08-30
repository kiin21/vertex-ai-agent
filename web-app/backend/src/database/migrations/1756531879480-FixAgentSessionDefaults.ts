import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAgentSessionDefaults1756531879480 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Set default value for last_update_time column and update existing null values
        await queryRunner.query(`
            ALTER TABLE "agent_sessions" 
            ALTER COLUMN "last_update_time" 
            SET DEFAULT EXTRACT(EPOCH FROM NOW())
        `);

        // Update any existing null values with current timestamp
        await queryRunner.query(`
            UPDATE "agent_sessions" 
            SET "last_update_time" = EXTRACT(EPOCH FROM NOW()) 
            WHERE "last_update_time" IS NULL
        `);

        // Set default value for timestamp column in agent_chats
        await queryRunner.query(`
            ALTER TABLE "agent_chats" 
            ALTER COLUMN "timestamp" 
            SET DEFAULT EXTRACT(EPOCH FROM NOW())
        `);

        // Update any existing null values with current timestamp
        await queryRunner.query(`
            UPDATE "agent_chats" 
            SET "timestamp" = EXTRACT(EPOCH FROM NOW()) 
            WHERE "timestamp" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the default values
        await queryRunner.query(`
            ALTER TABLE "agent_sessions" 
            ALTER COLUMN "last_update_time" 
            DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TABLE "agent_chats" 
            ALTER COLUMN "timestamp" 
            DROP DEFAULT
        `);
    }

}
