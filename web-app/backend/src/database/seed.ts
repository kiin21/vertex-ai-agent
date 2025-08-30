import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseSeeder } from './seeders/database.seeder';
import { SeederModule } from './seeders/seeder.module';

async function runSeeder() {
  console.log('🌱 Starting database seeding...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    const seeder = app.select(SeederModule).get(DatabaseSeeder);

    await seeder.seed();

    console.log('✅ Database seeding completed successfully!');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('🧹 Starting database clearing...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    const seeder = app.select(SeederModule).get(DatabaseSeeder);

    await seeder.clear();

    console.log('✅ Database cleared successfully!');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database clearing failed:', error);
    process.exit(1);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'seed') {
  runSeeder();
} else if (command === 'clear') {
  clearDatabase();
} else {
  console.log('Usage:');
  console.log('  npm run seed         - Seed the database with initial data');
  console.log('  npm run seed:clear   - Clear all data from the database');
  process.exit(1);
}
