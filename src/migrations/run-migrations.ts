import { AppDataSource } from '../data/data-source';

// Function to run migrations
async function runMigrations() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Data source has been initialized');

    // Run migrations
    const migrations = await AppDataSource.runMigrations();
    console.log(`Successfully ran ${migrations.length} migrations`);

    // Close the connection
    await AppDataSource.destroy();
    console.log('Data source has been closed');
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations()
  .then(() => {
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });
