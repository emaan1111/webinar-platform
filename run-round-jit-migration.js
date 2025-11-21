const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('📊 Adding roundJITTo15Minutes column to webinars table...')
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'add-round-jit-to-15-minutes.sql'),
      'utf8'
    )
    
    // Split by semicolons and filter empty
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement)
      console.log('✅ Executed:', statement.substring(0, 60) + '...')
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('📝 All webinars now have roundJITTo15Minutes set to true (default)')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
