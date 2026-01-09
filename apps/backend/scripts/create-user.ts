/* eslint-disable @typescript-eslint/no-explicit-any */
// Script to create or update a user in the database
// Usage: npx tsx scripts/create-user.ts <email> [password] [name] [role]
// Note: Password is optional when updating existing users (use "--keep-password" to skip password update)
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Create Prisma client directly (works in both dev and production)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function createOrUpdateUser() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('❌ Usage: npx tsx scripts/create-user.ts <email> [password] [name] [role]');
      console.error(
        '   Example (create): npx tsx scripts/create-user.ts user@example.com password123 "User Name" advertiser'
      );
      console.error(
        '   Example (update name only): npx tsx scripts/create-user.ts user@example.com --keep-password "New Name"'
      );
      console.error(
        '   Example (update password): npx tsx scripts/create-user.ts user@example.com newpassword123'
      );
      process.exit(1);
    }

    const email = args[0];
    let password: string | null = null;
    let name: string | null = null;
    let role: 'admin' | 'advertiser' = 'advertiser';
    let keepPassword = false;

    // Parse arguments
    let argIndex = 1;
    if (args[argIndex] === '--keep-password') {
      keepPassword = true;
      argIndex++;
    } else if (args[argIndex] && !args[argIndex].startsWith('--')) {
      password = args[argIndex];
      argIndex++;
    }

    if (args[argIndex] && !args[argIndex].startsWith('--')) {
      name = args[argIndex];
      argIndex++;
    }

    if (args[argIndex] && !args[argIndex].startsWith('--')) {
      role = args[argIndex] as 'admin' | 'advertiser';
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (existingUser) {
      // Update existing user
      const updates: {
        password?: string;
        name?: string | null;
        role?: string;
      } = {};

      // Only update password if provided and not using --keep-password
      if (password && !keepPassword) {
        const saltRounds = 12;
        updates.password = await bcrypt.hash(password, saltRounds);
      }

      if (name !== null) {
        updates.name = name;
      }

      if (role && existingUser.role !== role) {
        updates.role = role;
      }

      if (Object.keys(updates).length === 0) {
        console.log('ℹ️  No changes to apply');
        return;
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: updates as any,
      });

      console.log('✅ User updated successfully');
      console.log(`   Email: ${email}`);
      if (updates.password) {
        console.log(`   Password: Updated`);
      } else if (keepPassword) {
        console.log(`   Password: Kept unchanged`);
      }
      if (updates.name !== undefined) {
        console.log(`   Name: ${updates.name || '(removed)'}`);
      }
      if (updates.role) {
        console.log(`   Role: ${updates.role}`);
      }
    } else {
      // Create new user - password is required
      if (!password) {
        console.error('❌ Password is required when creating a new user');
        process.exit(1);
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

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
