const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('📊 Creating video_error_logs table...');
    
    // Create table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS video_error_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        webinar_id TEXT NOT NULL,
        registration_id TEXT,
        error_type TEXT NOT NULL,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        user_agent TEXT NOT NULL,
        device_info TEXT NOT NULL,
        video_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT fk_webinar
          FOREIGN KEY (webinar_id)
          REFERENCES webinars(id)
          ON DELETE CASCADE
      )
    `;
    console.log('✅ Table created');
    
    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_video_error_logs_webinar_id ON video_error_logs(webinar_id)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_video_error_logs_created_at ON video_error_logs(created_at DESC)
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_video_error_logs_error_type ON video_error_logs(error_type)
    `;
    console.log('✅ Indexes created');
    
    console.log('');
    console.log('✅ Video error logs table created successfully!');
    console.log('');
    console.log('You can now view error logs at: /dashboard/video-errors');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
