import { PrismaClient, UserRole } from '@prisma/client';

// @ts-ignore
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@elfijr.com';
  const adminPassword = 'Admin@123';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('First admin seeded successfully:');
  console.log(admin);
  console.log(`\nLogin with:`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
