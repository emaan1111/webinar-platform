/**
 * Migrate Local Database to Railway
 * 
 * This script copies all data from local database to Railway database
 */

const { PrismaClient } = require('@prisma/client');

// Local database connection
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://aribafarheen@localhost:5432/webinar_db'
    }
  }
});

// Railway database connection
const railwayPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:PGROlPewsCXdLjtvRxwAestaVJGldXmb@gondola.proxy.rlwy.net:24954/railway'
    }
  }
});

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from local to Railway...\n');

    // Create a map to store old ID -> new ID mappings
    const userIdMap = new Map();

    // 1. Migrate Users (excluding the admin we just created)
    console.log('📊 Migrating Users...');
    const localUsers = await localPrisma.user.findMany();
    console.log(`   Found ${localUsers.length} users in local database`);
    
    for (const user of localUsers) {
      const existing = await railwayPrisma.user.findUnique({
        where: { email: user.email }
      });
      
      if (!existing) {
        const newUser = await railwayPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: user.password,
            image: user.image,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
        userIdMap.set(user.id, newUser.id);
        console.log(`   ✅ Migrated user: ${user.email}`);
      } else {
        // Map the old local ID to the existing Railway user ID
        userIdMap.set(user.id, existing.id);
        console.log(`   ⏭️  Skipped user (already exists): ${user.email}, mapped ID: ${user.id} -> ${existing.id}`);
      }
    }

    // 2. Migrate Webinars
    console.log('\n📊 Migrating Webinars...');
    const localWebinars = await localPrisma.webinar.findMany();
    console.log(`   Found ${localWebinars.length} webinars in local database`);
    
    for (const webinar of localWebinars) {
      const existing = await railwayPrisma.webinar.findUnique({
        where: { id: webinar.id }
      });
      
      if (!existing) {
        // Use the mapped host ID
        const newHostId = userIdMap.get(webinar.hostId) || webinar.hostId;
        
        await railwayPrisma.webinar.create({
          data: {
            id: webinar.id,
            title: webinar.title,
            description: webinar.description,
            slug: webinar.slug,
            internalName: webinar.internalName,
            hostId: newHostId, // Use mapped ID
            scheduledAt: webinar.scheduledAt,
            duration: webinar.duration,
            status: webinar.status,
            maxAttendees: webinar.maxAttendees,
            isRecorded: webinar.isRecorded,
            recordingUrl: webinar.recordingUrl,
            thumbnailUrl: webinar.thumbnailUrl,
            streamKey: webinar.streamKey,
            streamUrl: webinar.streamUrl,
            chatEnabled: webinar.chatEnabled,
            qaEnabled: webinar.qaEnabled,
            pollsEnabled: webinar.pollsEnabled,
            registrationFields: webinar.registrationFields,
            settings: webinar.settings,
            abTestingEnabled: webinar.abTestingEnabled,
            createdAt: webinar.createdAt,
            updatedAt: webinar.updatedAt
          }
        });
        console.log(`   ✅ Migrated webinar: ${webinar.title} (host: ${webinar.hostId} -> ${newHostId})`);
      } else {
        console.log(`   ⏭️  Skipped webinar (already exists): ${webinar.title}`);
      }
    }

    // 3. Migrate Registrations
    console.log('\n📊 Migrating Registrations...');
    const localRegistrations = await localPrisma.registration.findMany();
    console.log(`   Found ${localRegistrations.length} registrations in local database`);
    
    for (const registration of localRegistrations) {
      const existing = await railwayPrisma.registration.findUnique({
        where: { id: registration.id }
      });
      
      if (!existing) {
        // Use the mapped user ID
        const newUserId = registration.userId ? (userIdMap.get(registration.userId) || registration.userId) : null;
        
        // Extract name and email from formData or use defaults
        let name = 'Unknown';
        let email = 'unknown@example.com';
        
        if (registration.formData && typeof registration.formData === 'object') {
          name = registration.formData.name || registration.formData.firstName || 'Unknown';
          email = registration.formData.email || 'unknown@example.com';
        }
        
        await railwayPrisma.registration.create({
          data: {
            id: registration.id,
            webinarId: registration.webinarId,
            userId: newUserId,
            name: name, // Required field
            email: email, // Required field
            phone: registration.formData?.phone || null,
            timezone: registration.formData?.timezone || null,
            country: registration.formData?.country || null,
            gdprConsent: registration.formData?.gdprConsent || false,
            privacyConsent: registration.formData?.privacyConsent || false,
            marketingConsent: registration.formData?.marketingConsent || false,
            registeredAt: registration.registeredAt || new Date(),
            attended: registration.attended || false,
            joinedAt: registration.attendedAt || null,
            firstJoinedAt: registration.attendedAt || null,
            referralCode: registration.referralCode || null
          }
        });
        console.log(`   ✅ Migrated registration: ${email}`);
      }
    }

    // 4. Migrate Analytics
    console.log('\n📊 Migrating Analytics...');
    const localAnalytics = await localPrisma.analytics.findMany();
    console.log(`   Found ${localAnalytics.length} analytics records in local database`);
    
    for (const analytics of localAnalytics) {
      const existing = await railwayPrisma.analytics.findUnique({
        where: { id: analytics.id }
      });
      
      if (!existing) {
        // Use the mapped user ID
        const newUserId = analytics.userId ? (userIdMap.get(analytics.userId) || analytics.userId) : null;
        
        await railwayPrisma.analytics.create({
          data: {
            id: analytics.id,
            webinarId: analytics.webinarId,
            userId: newUserId, // Use mapped ID
            registrationId: analytics.registrationId,
            eventType: analytics.eventType,
            eventData: analytics.eventData,
            timestamp: analytics.timestamp,
            ipAddress: analytics.ipAddress,
            userAgent: analytics.userAgent,
            country: analytics.country,
            city: analytics.city,
            deviceType: analytics.deviceType,
            browser: analytics.browser,
            os: analytics.os,
            referrer: analytics.referrer,
            duration: analytics.duration,
            createdAt: analytics.createdAt
          }
        });
      }
    }
    console.log(`   ✅ Migrated ${localAnalytics.length} analytics records`);

    // 5. Migrate Chat Messages
    console.log('\n📊 Migrating Chat Messages...');
    const localChatMessages = await localPrisma.chatMessage.findMany();
    console.log(`   Found ${localChatMessages.length} chat messages in local database`);
    
    for (const message of localChatMessages) {
      const existing = await railwayPrisma.chatMessage.findUnique({
        where: { id: message.id }
      });
      
      if (!existing) {
        // Use the mapped user ID
        const newUserId = message.userId ? (userIdMap.get(message.userId) || message.userId) : null;
        
        await railwayPrisma.chatMessage.create({
          data: {
            id: message.id,
            webinarId: message.webinarId,
            userId: newUserId, // Use mapped ID
            message: message.message,
            isQuestion: message.isQuestion,
            isAnswered: message.isAnswered,
            isPinned: message.isPinned,
            isModerated: message.isModerated,
            moderationStatus: message.moderationStatus,
            isAiGenerated: message.isAiGenerated,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
          }
        });
      }
    }
    console.log(`   ✅ Migrated ${localChatMessages.length} chat messages`);

    // 6. Migrate Reactions
    console.log('\n📊 Migrating Reactions...');
    const localReactions = await localPrisma.reaction.findMany();
    console.log(`   Found ${localReactions.length} reactions in local database`);
    
    for (const reaction of localReactions) {
      // Use the mapped user ID for checking existing
      const newUserId = userIdMap.get(reaction.userId) || reaction.userId;
      
      const existing = await railwayPrisma.reaction.findFirst({
        where: {
          userId: newUserId,
          webinarId: reaction.webinarId,
          type: reaction.type,
          createdAt: reaction.createdAt
        }
      });
      
      if (!existing) {
        await railwayPrisma.reaction.create({
          data: {
            id: reaction.id,
            webinarId: reaction.webinarId,
            userId: newUserId, // Use mapped ID
            type: reaction.type,
            createdAt: reaction.createdAt
          }
        });
      }
    }
    console.log(`   ✅ Migrated ${localReactions.length} reactions`);

    console.log('\n✅ Migration completed successfully! 🎉');

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await railwayPrisma.$disconnect();
  }
}

// Run migration
migrateData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
