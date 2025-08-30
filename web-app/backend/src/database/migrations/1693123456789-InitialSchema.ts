import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1693123456789 implements MigrationInterface {
  name = 'InitialSchema1693123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types first
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'instructor', 'student')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );

    // Create users table
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "email" character varying(320) NOT NULL,
                "password" character varying(255) NOT NULL,
                "role" "public"."user_role_enum" NOT NULL DEFAULT 'student',
                "status" "public"."user_status_enum" NOT NULL DEFAULT 'active',
                "email_verified" boolean NOT NULL DEFAULT false,
                "last_login_at" TIMESTAMP,
                "login_attempts" integer NOT NULL DEFAULT 0,
                "locked_until" TIMESTAMP,
                "password_changed_at" TIMESTAMP,
                "profile_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

    // Create user_profiles table
    await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "finance_preferences" jsonb,
                "career_goals" jsonb,
                "learning_history" jsonb,
                "university" character varying(100),
                "major" character varying(100),
                "year_of_study" integer,
                "interests" text array,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_profiles_id" PRIMARY KEY ("id"),
                CONSTRAINT "REL_user_profiles_user_id" UNIQUE ("user_id")
            )
        `);

    // Create students table
    await queryRunner.query(`
            CREATE TABLE "students" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "student_id" character varying(50) NOT NULL,
                "first_name" character varying(100) NOT NULL,
                "last_name" character varying(100) NOT NULL,
                "email" character varying(320) NOT NULL,
                "date_of_birth" date NOT NULL,
                "gender" character varying(10),
                "grade" character varying(50) NOT NULL,
                "academic_year" character varying(20) NOT NULL,
                "enrollment_date" date NOT NULL DEFAULT CURRENT_DATE,
                "graduation_date" date,
                "is_active" boolean NOT NULL DEFAULT true,
                "phone" character varying(20),
                "address" text,
                "emergency_contact" jsonb,
                "academic_info" jsonb,
                "preferences" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_students_email" UNIQUE ("email"),
                CONSTRAINT "UQ_students_student_id" UNIQUE ("student_id"),
                CONSTRAINT "PK_students_id" PRIMARY KEY ("id")
            )
        `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_deleted_at" ON "users" ("email", "deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_status_deleted_at" ON "users" ("status", "deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_name" ON "users" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role" ON "users" ("role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_status" ON "users" ("status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_students_email_deleted_at" ON "students" ("email", "deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_user_id_deleted_at" ON "students" ("user_id", "deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_is_active_deleted_at" ON "students" ("is_active", "deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_student_id" ON "students" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_email" ON "students" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_is_active" ON "students" ("is_active")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_profile_id" 
            FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "user_profiles" 
            ADD CONSTRAINT "FK_user_profiles_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "students" 
            ADD CONSTRAINT "FK_students_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_students_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_profile_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_students_is_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_students_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_students_student_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_students_is_active_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_students_user_id_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_students_email_deleted_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_users_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_name"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_users_status_deleted_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email_deleted_at"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
