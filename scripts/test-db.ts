import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file explicitly BEFORE importing any client
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  console.log('🔄 Initializing Prisma Client with Neon Serverless driver adapter...');
  
  // Dynamically import prisma to guarantee dotenv.config() has run and process.env is populated
  const { prisma } = await import('../lib/prisma');

  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined (hidden for security)' : 'Undefined');
    console.log('📡 Testing connection to Neon PostgreSQL database...');
    
    // Perform a raw select query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✅ Database raw query connection test succeeded!', result);

    // Try counting the user records as a model-level check
    console.log('👥 Querying User table...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table query succeeded! Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Database connection test failed!');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected Prisma Client.');
  }
}

main();
