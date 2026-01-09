/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a deployment script - Prisma types may not be fully up to date
// but the role field exists in the schema and will work at runtime
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Create Prisma client directly (works in both dev and production)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function initAdmin() {
  try {
    const adminEmail = 'admin@tektag.ai';
    const adminPassword = 'admin0';

    // First, check if admin exists by email
    let existingAdmin = (await prisma.user.findUnique({
      where: { email: adminEmail },
    })) as { id: string; email: string; password: string; role: string } | null;

    // If not found by email, check if there's any user with admin role
    if (!existingAdmin) {
      existingAdmin = (await prisma.user.findFirst({
        where: { role: 'admin' } as any,
      })) as { id: string; email: string; password: string; role: string } | null;
    }

    if (existingAdmin) {
      // Admin exists - check if updates are needed
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      const updates: {
        email?: string;
        password?: string;
        role?: string;
      } = {};

      // Update email if it changed
      if (existingAdmin.email !== adminEmail) {
        updates.email = adminEmail;
      }

      // Always update password to ensure it matches the script
      updates.password = hashedPassword;

      // Ensure role is admin
      if (existingAdmin.role !== 'admin') {
        updates.role = 'admin';
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: updates as any,
        });
        console.log('✅ Admin user updated');
        if (updates.email) {
          console.log(`   Email updated to: ${adminEmail}`);
        }
        if (updates.password) {
          console.log(`   Password updated`);
        }
        if (updates.role) {
          console.log(`   Role set to: admin`);
        }
      } else {
        console.log('✅ Admin user already exists with correct credentials');
      }
      return;
    }

    // Create admin user if it doesn't exist
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      } as any,
    });

    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initAdmin();
