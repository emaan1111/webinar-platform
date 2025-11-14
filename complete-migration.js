/**
 * COMPLETE Migration Script - Local to Railway
 * Migrates ALL data including templates, schedules, offers, embeds, etc.
 */

const { PrismaClient } = require('@prisma/client');

// Local database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://aribafarheen@localhost:5432/webinar_db'
    }
  }
});

// Railway database
const railwayPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:PGROlPewsCXdLjtvRxwAestaVJGldXmb@gondola.proxy.rlwy.net:24954/railway'
    }
  }
});

async function migrateEverything() {
  try {
    console.log('🚀 COMPLETE DATA MIGRATION - Local to Railway\n');
    console.log('='.repeat(60) + '\n');

    // Track ID mappings
    const userIdMap = new Map();
    const webinarIdMap = new Map();
    const registrationIdMap = new Map();

    // ==================== USERS ====================
    console.log('👤 STEP 1: Migrating Users...');
    const localUsers = await localPrisma.user.findMany();
    console.log(`   Found ${localUsers.length} users in local DB`);
    
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
        console.log(`   ✅ Migrated: ${user.email}`);
      } else {
        userIdMap.set(user.id, existing.id);
        console.log(`   ⏭️  Exists: ${user.email} (mapped ${user.id} → ${existing.id})`);
      }
    }

    // ==================== WEBINARS ====================
    console.log('\n🎥 STEP 2: Migrating Webinars...');
    const localWebinars = await localPrisma.webinar.findMany();
    console.log(`   Found ${localWebinars.length} webinars in local DB`);
    
    for (const webinar of localWebinars) {
      const existing = await railwayPrisma.webinar.findUnique({
        where: { id: webinar.id }
      });
      
      if (!existing) {
        const newHostId = userIdMap.get(webinar.hostId) || webinar.hostId;
        
        const newWebinar = await railwayPrisma.webinar.create({
          data: {
            id: webinar.id,
            title: webinar.title,
            slug: webinar.slug,
            internalName: webinar.internalName,
            description: webinar.description,
            thumbnail: webinar.thumbnail,
            duration: webinar.duration,
            vimeoVideoId: webinar.vimeoVideoId,
            videoUrl: webinar.videoUrl,
            videoDuration: webinar.videoDuration,
            recordingUrl: webinar.recordingUrl,
            hostId: newHostId,
            hasReplay: webinar.hasReplay,
            hasOffers: webinar.hasOffers,
            hasChat: webinar.hasChat,
            hasReactions: webinar.hasReactions,
            showElapsedTime: webinar.showElapsedTime,
            maxSchedulesToShow: webinar.maxSchedulesToShow,
            registrationPageId: webinar.registrationPageId,
            thankYouTemplateId: webinar.thankYouTemplateId,
            countdownTemplateId: webinar.countdownTemplateId,
            countdownPageId: webinar.countdownPageId,
            enableABTesting: webinar.enableABTesting,
            trafficSplitPercent: webinar.trafficSplitPercent,
            testRegistrationPage: webinar.testRegistrationPage,
            regPageAId: webinar.regPageAId,
            regPageBId: webinar.regPageBId,
            testSchedule: webinar.testSchedule,
            scheduleAIds: webinar.scheduleAIds,
            scheduleBIds: webinar.scheduleBIds,
            testOffer: webinar.testOffer,
            offerAId: webinar.offerAId,
            offerBId: webinar.offerBId,
            testVideo: webinar.testVideo,
            videoAId: webinar.videoAId,
            videoBId: webinar.videoBId,
            whatsappShareMessage: webinar.whatsappShareMessage,
            facebookShareMessage: webinar.facebookShareMessage,
            createdAt: webinar.createdAt,
            updatedAt: webinar.updatedAt
          }
        });
        webinarIdMap.set(webinar.id, newWebinar.id);
        console.log(`   ✅ Migrated: ${webinar.title}`);
      } else {
        webinarIdMap.set(webinar.id, existing.id);
        console.log(`   ⏭️  Exists: ${webinar.title}`);
      }
    }

    // ==================== REGISTRATION PAGES (includes popup/embed) ====================
    console.log('\n📄 STEP 3: Migrating Registration Pages (Popup/Embed)...');
    const localRegPages = await localPrisma.registrationPage.findMany();
    console.log(`   Found ${localRegPages.length} registration pages in local DB`);
    
    for (const page of localRegPages) {
      const existing = await railwayPrisma.registrationPage.findUnique({
        where: { id: page.id }
      });
      
      if (!existing) {
        await railwayPrisma.registrationPage.create({
          data: {
            id: page.id,
            name: page.name,
            description: page.description,
            htmlCode: page.htmlCode,
            collectPhone: page.collectPhone,
            collectCompany: page.collectCompany,
            collectCustom1: page.collectCustom1,
            customField1Label: page.customField1Label,
            collectCustom2: page.collectCustom2,
            customField2Label: page.customField2Label,
            showHostInfo: page.showHostInfo,
            showBenefits: page.showBenefits,
            showTestimonials: page.showTestimonials,
            showCountdown: page.showCountdown,
            showSocialProof: page.showSocialProof,
            showVideo: page.showVideo,
            videoUrl: page.videoUrl,
            videoTitle: page.videoTitle,
            videoAutoplay: page.videoAutoplay,
            testimonial1Text: page.testimonial1Text,
            testimonial1Author: page.testimonial1Author,
            testimonial1Image: page.testimonial1Image,
            testimonial2Text: page.testimonial2Text,
            testimonial2Author: page.testimonial2Author,
            testimonial2Image: page.testimonial2Image,
            testimonial3Text: page.testimonial3Text,
            testimonial3Author: page.testimonial3Author,
            testimonial3Image: page.testimonial3Image,
            benefit1: page.benefit1,
            benefit2: page.benefit2,
            benefit3: page.benefit3,
            benefit4: page.benefit4,
            benefit5: page.benefit5,
            logoUrl: page.logoUrl,
            primaryColor: page.primaryColor,
            secondaryColor: page.secondaryColor,
            backgroundColor: page.backgroundColor,
            textColor: page.textColor,
            ctaButtonText: page.ctaButtonText,
            ctaButtonStyle: page.ctaButtonStyle,
            showFooter: page.showFooter,
            footerText: page.footerText,
            privacyPolicyUrl: page.privacyPolicyUrl,
            termsOfServiceUrl: page.termsOfServiceUrl,
            thumbnail: page.thumbnail,
            metaDescription: page.metaDescription,
            isSystem: page.isSystem,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
          }
        });
        console.log(`   ✅ Migrated: ${page.name} (includes popup/embed settings)`);
      } else {
        console.log(`   ⏭️  Exists: ${page.name}`);
      }
    }

    // ==================== THANK YOU TEMPLATES ====================
    console.log('\n🎉 STEP 4: Migrating Thank You Templates...');
    const localThankYou = await localPrisma.thankYouTemplate.findMany();
    console.log(`   Found ${localThankYou.length} thank you templates in local DB`);
    
    for (const template of localThankYou) {
      const existing = await railwayPrisma.thankYouTemplate.findUnique({
        where: { id: template.id }
      });
      
      if (!existing) {
        await railwayPrisma.thankYouTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            htmlCode: template.htmlCode,
            headline: template.headline,
            subheadline: template.subheadline,
            videoUrl: template.videoUrl,
            showCalendar: template.showCalendar,
            showShareButtons: template.showShareButtons,
            isSystem: template.isSystem,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
          }
        });
        console.log(`   ✅ Migrated: ${template.name}`);
      } else {
        console.log(`   ⏭️  Exists: ${template.name}`);
      }
    }

    // ==================== COUNTDOWN TEMPLATES ====================
    console.log('\n⏱️  STEP 5: Migrating Countdown Templates...');
    const localCountdown = await localPrisma.countdownTemplate.findMany();
    console.log(`   Found ${localCountdown.length} countdown templates in local DB`);
    
    for (const template of localCountdown) {
      const existing = await railwayPrisma.countdownTemplate.findUnique({
        where: { id: template.id }
      });
      
      if (!existing) {
        await railwayPrisma.countdownTemplate.create({
          data: {
            id: template.id,
            name: template.name,
            htmlCode: template.htmlCode,
            headline: template.headline,
            subheadline: template.subheadline,
            showHostInfo: template.showHostInfo,
            hostName: template.hostName,
            hostImage: template.hostImage,
            hostBio: template.hostBio,
            showBenefits: template.showBenefits,
            benefit1: template.benefit1,
            benefit2: template.benefit2,
            benefit3: template.benefit3,
            backgroundColor: template.backgroundColor,
            textColor: template.textColor,
            primaryColor: template.primaryColor,
            secondaryColor: template.secondaryColor,
            isSystem: template.isSystem,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt
          }
        });
        console.log(`   ✅ Migrated: ${template.name}`);
      } else {
        console.log(`   ⏭️  Exists: ${template.name}`);
      }
    }

    // ==================== WEBINAR SCHEDULES ====================
    console.log('\n📅 STEP 6: Migrating Webinar Schedules...');
    const localSchedules = await localPrisma.webinarSchedule.findMany();
    console.log(`   Found ${localSchedules.length} schedules in local DB`);
    
    for (const schedule of localSchedules) {
      const existing = await railwayPrisma.webinarSchedule.findUnique({
        where: { id: schedule.id }
      });
      
      if (!existing) {
        const newWebinarId = webinarIdMap.get(schedule.webinarId) || schedule.webinarId;
        
        await railwayPrisma.webinarSchedule.create({
          data: {
            id: schedule.id,
            webinarId: newWebinarId,
            scheduleType: schedule.scheduleType,
            scheduledAt: schedule.scheduledAt,
            timezone: schedule.timezone,
            useUserTimezone: schedule.useUserTimezone,
            minutesFromReg: schedule.minutesFromReg,
            recurringPattern: schedule.recurringPattern,
            isActive: schedule.isActive,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt
          }
        });
        console.log(`   ✅ Migrated: ${schedule.scheduleType} schedule`);
      } else {
        console.log(`   ⏭️  Exists: schedule ${schedule.id}`);
      }
    }

    // ==================== REGISTRATIONS ====================
    console.log('\n✍️  STEP 7: Migrating Registrations...');
    const localRegistrations = await localPrisma.registration.findMany();
    console.log(`   Found ${localRegistrations.length} registrations in local DB`);
    
    for (const registration of localRegistrations) {
      const existing = await railwayPrisma.registration.findUnique({
        where: { id: registration.id }
      });
      
      if (!existing) {
        const newUserId = registration.userId ? (userIdMap.get(registration.userId) || registration.userId) : null;
        const newWebinarId = webinarIdMap.get(registration.webinarId) || registration.webinarId;
        
        const newReg = await railwayPrisma.registration.create({
          data: {
            id: registration.id,
            webinarId: newWebinarId,
            userId: newUserId,
            scheduleId: registration.scheduleId,
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            timezone: registration.timezone,
            country: registration.country,
            gdprConsent: registration.gdprConsent,
            privacyConsent: registration.privacyConsent,
            marketingConsent: registration.marketingConsent,
            registeredAt: registration.registeredAt,
            scheduledStartTime: registration.scheduledStartTime,
            attended: registration.attended,
            joinedAt: registration.joinedAt,
            firstJoinedAt: registration.firstJoinedAt,
            leftAt: registration.leftAt,
            testGroup: registration.testGroup,
            referralCode: registration.referralCode,
            referredBy: registration.referredBy,
            createdAt: registration.createdAt,
            updatedAt: registration.updatedAt
          }
        });
        registrationIdMap.set(registration.id, newReg.id);
        console.log(`   ✅ Migrated: ${registration.email}`);
      } else {
        registrationIdMap.set(registration.id, existing.id);
        console.log(`   ⏭️  Exists: ${registration.email}`);
      }
    }

    // ==================== OFFERS ====================
    console.log('\n💰 STEP 8: Migrating Offers...');
    const localOffers = await localPrisma.offer.findMany();
    console.log(`   Found ${localOffers.length} offers in local DB`);
    
    for (const offer of localOffers) {
      const existing = await railwayPrisma.offer.findUnique({
        where: { id: offer.id }
      });
      
      if (!existing) {
        const newWebinarId = webinarIdMap.get(offer.webinarId) || offer.webinarId;
        
        await railwayPrisma.offer.create({
          data: {
            id: offer.id,
            webinarId: newWebinarId,
            title: offer.title,
            description: offer.description,
            price: offer.price,
            originalPrice: offer.originalPrice,
            discountLabel: offer.discountLabel,
            countdownDuration: offer.countdownDuration,
            bulletPoints: offer.bulletPoints,
            ctaText: offer.ctaText,
            ctaUrl: offer.ctaUrl,
            videoTimestamp: offer.videoTimestamp,
            hideAfter: offer.hideAfter,
            isActive: offer.isActive,
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt
          }
        });
        console.log(`   ✅ Migrated: ${offer.title}`);
      } else {
        console.log(`   ⏭️  Exists: ${offer.title}`);
      }
    }

    // ==================== ATTENDEE SESSIONS ====================
    console.log('\n📊 STEP 9: Migrating Attendee Sessions...');
    const localSessions = await localPrisma.attendeeSession.findMany({
      include: {
        registration: {
          select: {
            webinarId: true
          }
        }
      }
    });
    console.log(`   Found ${localSessions.length} attendee sessions in local DB`);
    
    for (const session of localSessions) {
      const existing = await railwayPrisma.attendeeSession.findUnique({
        where: { id: session.id }
      });
      
      if (!existing) {
        const newRegistrationId = registrationIdMap.get(session.registrationId) || session.registrationId;
        const newWebinarId = webinarIdMap.get(session.registration.webinarId) || session.registration.webinarId;
        
        await railwayPrisma.attendeeSession.create({
          data: {
            id: session.id,
            registrationId: newRegistrationId,
            webinarId: newWebinarId,
            joinedAt: session.joinedAt,
            leftAt: session.leftAt,
            durationSeconds: session.durationSeconds,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            country: session.country,
            city: session.city,
            deviceType: session.deviceType,
            browser: session.browser,
            os: session.os,
            createdAt: session.createdAt
          }
        });
      }
    }
    console.log(`   ✅ Migrated ${localSessions.length} attendee sessions`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETE MIGRATION FINISHED! 🎉\n');
    console.log('Summary:');
    console.log(`  Users: ${localUsers.length}`);
    console.log(`  Webinars: ${localWebinars.length}`);
    console.log(`  Registration Pages: ${localRegPages.length} (includes popup/embed)`);
    console.log(`  Thank You Templates: ${localThankYou.length}`);
    console.log(`  Countdown Templates: ${localCountdown.length}`);
    console.log(`  Schedules: ${localSchedules.length}`);
    console.log(`  Registrations: ${localRegistrations.length}`);
    console.log(`  Offers: ${localOffers.length}`);
    console.log(`  Attendee Sessions: ${localSessions.length}`);

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await railwayPrisma.$disconnect();
  }
}

// Run complete migration
migrateEverything()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
