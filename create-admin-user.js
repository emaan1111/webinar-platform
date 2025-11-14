/**
 * Create Admin User Script for Replit
 * 
 * Run this on Replit with: node create-admin-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔵 Starting admin user creation...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'ariba.farheen@gmail.com' }
    });

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      console.log('   User ID:', existingUser.id);
      console.log('   Name:', existingUser.name);
      console.log('   Role:', existingUser.role);
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'ariba.farheen@gmail.com',
        name: 'Ariba Farheen',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('   Email:', user.email);
    console.log('   Password: Admin123!');
    console.log('   User ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('');
    console.log('🎉 You can now log in with:');
    console.log('   Email: ariba.farheen@gmail.com');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
