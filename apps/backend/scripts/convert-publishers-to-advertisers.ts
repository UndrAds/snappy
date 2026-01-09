/* eslint-disable @typescript-eslint/no-explicit-any */
// Script to convert all existing "publisher" role users to "advertiser" role
// Usage: npx tsx scripts/convert-publishers-to-advertisers.ts
import { PrismaClient } from '@prisma/client';

// Create Prisma client directly (works in both dev and production)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function convertPublishersToAdvertisers() {
  try {
    console.log('🔄 Starting conversion of publishers to advertisers...');

    // Find all users with role "publisher"
    const publishers = await prisma.user.findMany({
      where: {
        role: 'publisher',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (publishers.length === 0) {
      console.log('✅ No users with "publisher" role found. Nothing to convert.');
      return;
    }

    console.log(`📊 Found ${publishers.length} user(s) with "publisher" role:`);
    publishers.forEach((user) => {
      console.log(`   - ${user.email}${user.name ? ` (${user.name})` : ''}`);
    });

    // Update all publishers to advertisers
    const result = await prisma.user.updateMany({
      where: {
        role: 'publisher',
      },
      data: {
        role: 'advertiser',
      },
    });

    console.log(
      `✅ Successfully converted ${result.count} user(s) from "publisher" to "advertiser" role.`
    );

    // Verify the conversion
    const remainingPublishers = await prisma.user.count({
      where: {
        role: 'publisher',
      },
    });

    if (remainingPublishers === 0) {
      console.log('✅ Verification: No users with "publisher" role remain.');
    } else {
      console.warn(`⚠️  Warning: ${remainingPublishers} user(s) still have "publisher" role.`);
    }

    // Show updated users
    const updatedUsers = await prisma.user.findMany({
      where: {
        role: 'advertiser',
        id: {
          in: publishers.map((p) => p.id),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log('\n📋 Updated users:');
    updatedUsers.forEach((user) => {
      console.log(`   ✅ ${user.email}${user.name ? ` (${user.name})` : ''} - now ${user.role}`);
    });
  } catch (error) {
    console.error('❌ Error converting publishers to advertisers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

convertPublishersToAdvertisers();
