import { AppDataSource } from '../data-source';
import { seedServiceTypes } from './service-types.seed';
import { seedServices } from './services.seed';

async function runSeeds() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established!');

    console.log('\n--- Starting Database Seeding ---\n');

    // Run service types seed
    await seedServiceTypes(AppDataSource);

    // Run services seed
    await seedServices(AppDataSource);

    console.log('\n--- Database Seeding Completed Successfully ---\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

runSeeds();
