import bcrypt from 'bcryptjs';
import prisma from '../src/config/database';

async function initAdmin() {
  try {
    const adminEmail = 'admin@tektag.ai';
    const adminPassword = 'admin0';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      // Update existing admin to ensure role is set
      if (existingAdmin.role !== 'admin') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'admin' },
        });
        console.log('✅ Updated existing user to admin role');
      } else {
        // Update password in case it changed
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { password: hashedPassword },
        });
        console.log('✅ Admin user already exists, password updated');
      }
      return;
    }

    // Create admin user
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      },
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
