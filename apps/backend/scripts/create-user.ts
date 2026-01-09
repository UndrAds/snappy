/* eslint-disable @typescript-eslint/no-explicit-any */
// Script to create or update a user in the database
// Usage: npx tsx scripts/create-user.ts <email> <password> [name] [role]
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Create Prisma client directly (works in both dev and production)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function createOrUpdateUser() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error('❌ Usage: npx tsx scripts/create-user.ts <email> <password> [name] [role]');
      console.error(
        '   Example: npx tsx scripts/create-user.ts user@example.com password123 "User Name" advertiser'
      );
      process.exit(1);
    }

    const email = args[0];
    const password = args[1];
    const name = args[2] || null;
    const role = (args[3] as 'admin' | 'advertiser') || 'advertiser';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (existingUser) {
      // Update existing user
      const updates: {
        password: string;
        name?: string | null;
        role?: string;
      } = {
        password: hashedPassword,
      };

      if (name !== null) {
        updates.name = name;
      }

      if (role && existingUser.role !== role) {
        updates.role = role;
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: updates as any,
      });

      console.log('✅ User updated successfully');
      console.log(`   Email: ${email}`);
      console.log(`   Password: Updated`);
      if (updates.name) {
        console.log(`   Name: ${updates.name}`);
      }
      if (updates.role) {
        console.log(`   Role: ${updates.role}`);
      }
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role: role as any,
        },
      });

      console.log('✅ User created successfully');
      console.log(`   Email: ${email}`);
      console.log(`   Password: Set`);
      if (name) {
        console.log(`   Name: ${name}`);
      }
      console.log(`   Role: ${role}`);
    }
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createOrUpdateUser();
