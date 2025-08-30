import dataSource from './data-source';

async function verifyDatabase() {
  console.log('🔍 Verifying database schema...');

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check if tables exist
    const queryRunner = dataSource.createQueryRunner();

    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Database Tables:');
    tables.forEach((table: any) => {
      console.log(`  ✓ ${table.table_name}`);
    });

    // Check migration history
    const migrations = await queryRunner.query(`
      SELECT * FROM migrations ORDER BY timestamp DESC;
    `);

    console.log('\n📜 Migration History:');
    if (migrations.length === 0) {
      console.log('  ⚠️  No migrations found');
    } else {
      migrations.forEach((migration: any) => {
        console.log(
          `  ✓ ${migration.name} (${new Date(
            migration.timestamp,
          ).toISOString()})`,
        );
      });
    }

    // Check indexes
    const indexes = await queryRunner.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    console.log('\n🔗 Database Indexes:');
    indexes.forEach((index: any) => {
      console.log(`  ✓ ${index.tablename}.${index.indexname}`);
    });

    // Check foreign keys
    const foreignKeys = await queryRunner.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `);

    console.log('\n🔗 Foreign Key Relationships:');
    foreignKeys.forEach((fk: any) => {
      console.log(
        `  ✓ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`,
      );
    });

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Database verification completed successfully!');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Run verification
verifyDatabase();
