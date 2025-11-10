import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create multiple test users
  const users = [
    { email: 'admin@test.com', name: 'Admin User', password: 'password123', role: 'ADMIN' },
    { email: 'ariba.farheen@gmail.com', name: 'Ariba Farheen', password: 'password123', role: 'ADMIN' },
  ];

  for (const userData of users) {
    // Delete existing user if exists
    await prisma.user.deleteMany({
      where: { email: userData.email }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role as any,
      },
    });

    console.log('✅ User created successfully!');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password:', userData.password);
    console.log('👤 User ID:', user.id);
    
    // Verify password works
    const isValid = await bcrypt.compare(userData.password, hashedPassword);
    console.log('✓ Password verification:', isValid ? 'PASSED' : 'FAILED');
    console.log('---');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
