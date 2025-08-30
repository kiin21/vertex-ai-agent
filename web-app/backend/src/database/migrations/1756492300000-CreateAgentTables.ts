import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgentTables1756492300000 implements MigrationInterface {
  name = 'CreateAgentTables1756492300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for agent tables
    await queryRunner.query(
      `CREATE TYPE "public"."agent_chats_role_enum" AS ENUM('user', 'model', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."agent_chats_author_enum" AS ENUM('user', 'orchestrator_agent', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."agent_sessions_state_enum" AS ENUM('active', 'inactive', 'deleted')`,
    );

    // Create agent_sessions table
    await queryRunner.query(`
            CREATE TABLE "agent_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "external_id" character varying NOT NULL,
                "user_id" uuid NOT NULL,
                "app_name" character varying NOT NULL,
                "state" "public"."agent_sessions_state_enum" NOT NULL DEFAULT 'active',
                "session_metadata" json,
                "last_update_time" bigint NOT NULL,
                "title" character varying,
                "summary" text,
                "message_count" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agent_sessions" PRIMARY KEY ("id")
            )
        `);

    // Create agent_chats table
    await queryRunner.query(`
            CREATE TABLE "agent_chats" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "session_id" uuid NOT NULL,
                "external_id" character varying,
                "invocation_id" character varying,
                "role" "public"."agent_chats_role_enum" NOT NULL DEFAULT 'user',
                "author" "public"."agent_chats_author_enum" NOT NULL DEFAULT 'user',
                "content" text NOT NULL,
                "metadata" json,
                "actions" json,
                "thought_signature" character varying,
                "finish_reason" character varying,
                "usage_metadata" json,
                "timestamp" bigint NOT NULL,
                "turn_complete" boolean NOT NULL DEFAULT false,
                "error_message" character varying,
                "error_code" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agent_chats" PRIMARY KEY ("id")
            )
        `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_sessions_user_created" ON "agent_sessions" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_agent_chats_session_timestamp" ON "agent_chats" ("session_id", "timestamp")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "agent_sessions" 
            ADD CONSTRAINT "FK_agent_sessions_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "agent_chats" 
            ADD CONSTRAINT "FK_agent_chats_session_id" 
            FOREIGN KEY ("session_id") REFERENCES "agent_sessions"("id") ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "agent_chats" DROP CONSTRAINT "FK_agent_chats_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agent_sessions" DROP CONSTRAINT "FK_agent_sessions_user_id"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_agent_chats_session_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_agent_sessions_user_created"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "agent_chats"`);
    await queryRunner.query(`DROP TABLE "agent_sessions"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."agent_sessions_state_enum"`);
    await queryRunner.query(`DROP TYPE "public"."agent_chats_author_enum"`);
    await queryRunner.query(`DROP TYPE "public"."agent_chats_role_enum"`);
  }
}
