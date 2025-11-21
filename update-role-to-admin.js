// Script to update user role to ADMIN
// Usage: node update-role-to-admin.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateRoleToAdmin() {
  try {
    const email = 'aribafarheen@gmail.com' // Change this to your email if different
    
    console.log(`Updating role to ADMIN for: ${email}`)
    
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })
    
    console.log('✅ Success! User role updated:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log('\nYou can now access the attendee profile page!')
    
  } catch (error) {
    console.error('❌ Error updating user role:', error.message)
    
    if (error.code === 'P2025') {
      console.error('\nUser not found. Please check the email address.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

updateRoleToAdmin()
