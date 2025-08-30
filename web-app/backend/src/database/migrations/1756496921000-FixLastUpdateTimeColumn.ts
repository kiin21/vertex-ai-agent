import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixLastUpdateTimeColumn1756496921000 implements MigrationInterface {
  name = 'FixLastUpdateTimeColumn1756496921000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change the last_update_time column from bigint to decimal to support millisecond precision
    await queryRunner.query(
      `ALTER TABLE "agent_sessions" ALTER COLUMN "last_update_time" TYPE DECIMAL(20,6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to bigint (note: this may cause data loss if there are decimal values)
    await queryRunner.query(
      `ALTER TABLE "agent_sessions" ALTER COLUMN "last_update_time" TYPE BIGINT`,
    );
  }
}
