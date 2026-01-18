const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Analyzing Split Test Data Source...')

  // 1. Diagnostic: Check counts in potential tables
  const abMetricsCount = await prisma.aBTestMetric.count({ where: { registrationId: { not: null } } });
  console.log(`Linked ABTestMetric records: ${abMetricsCount}`);
  
  const pageVisitsCount = await prisma.pageVisit.count({
    where: { pageType: 'registration', registrationId: { not: null } }
  });
  console.log(`Linked PageVisit (registration) records: ${pageVisitsCount}`);

  const registrationCount = await prisma.registration.count();
  console.log(`Total Registration records: ${registrationCount}`);
  
  const splitTestEventsCount = await prisma.splitTestEvent.count();
  console.log(`Total SplitTestEvent records: ${splitTestEventsCount}`);
  
  const convertedMetricsCount = await prisma.aBTestMetric.count({ where: { converted: true } });
  console.log(`Total Converted ABTestMetric records: ${convertedMetricsCount}`);

  // 2. Decide which source to use
  let source = '';
  // Prefer the source that covers the most registrations
  // If we have nearly full coverage in metrics/visits, use them (they might be more granular)
  // Otherwise fallback to Registration table + Config
  
  if (abMetricsCount >= registrationCount * 0.9) source = 'ABTestMetric';
  else if (pageVisitsCount >= registrationCount * 0.9) source = 'PageVisit';
  else {
      // Check for Transitive Visitor Link
      const transitiveCount = await prisma.splitTestEvent.count({ where: { visitorId: { not: null } } });
      if (transitiveCount > 0) source = 'TransitiveVisitor';
      else source = 'Inferred';
  }

  console.log(`Using source: ${source}`);

  let stats = {};

  if (source === 'TransitiveVisitor') {
      console.log('Using Transitive Visitor Link (SplitTestEvent -> PageVisit -> Registration)');
      
      const events = await prisma.splitTestEvent.findMany({
          where: { visitorId: { not: null } },
          include: { variant: { include: { leadPage: true } } }
      });
      console.log(`Found ${events.length} SplitTestEvents.`);
      
      const visitorVariant = {};
      events.forEach(e => {
          if (e.visitorId && e.variant?.leadPage?.name) {
              visitorVariant[e.visitorId] = e.variant.leadPage.name;
          }
      });
      
      const visitorIds = Object.keys(visitorVariant);
      console.log(`Found ${visitorIds.length} unique visitors in SplitTestEvents.`);
      
      const pageVisits = await prisma.pageVisit.findMany({
          where: {
              visitorId: { in: visitorIds },
              registrationId: { not: null }
          },
          select: { visitorId: true, registrationId: true }
      });
      
      console.log(`Found ${pageVisits.length} PageVisits linking visitors to registrations.`);
      
      const regVariant = {};
      pageVisits.forEach(pv => {
          if (pv.visitorId && visitorVariant[pv.visitorId]) {
              regVariant[pv.registrationId] = visitorVariant[pv.visitorId];
          }
      });
      
      const linkedRegIds = Object.keys(regVariant);
      console.log(`Successfully linked ${linkedRegIds.length} registrations to variants.`);
      
      // Fetch ALL registrations to show full picture
      const registrations = await prisma.registration.findMany({
          include: { sessions: true }
      });
      console.log(`Processing ${registrations.length} total registrations.`);
      
      for (const reg of registrations) {
          const variant = regVariant[reg.id] || 'Unknown';
          if (!stats[variant]) stats[variant] = { total: 0, attended: 0, stayed60: 0 };
          stats[variant].total++;
          if (reg.attended) stats[variant].attended++;
          const sessions = reg.sessions || [];
          const maxDuration = sessions.reduce((acc, s) => Math.max(acc, s.videoPosition || 0), 0);
          if (maxDuration >= 3600) stats[variant].stayed60++;
      }
  } else if (source === 'ABTestMetric') {
    // Debug: Check sample metrics
    const debugMetrics = await prisma.aBTestMetric.findMany({ take: 5 });
    console.log('Sample ABTestMetric:', debugMetrics);

    const metrics = await prisma.aBTestMetric.findMany({
      where: {
        // element: 'registration', // Commenting out to be safe
        registrationId: { not: null }
      },
      include: {
        registration: {
          include: { sessions: true }
        }
      }
    });
    
    console.log(`Found ${metrics.length} linked ABTestMetric records.`);
    
    for (const m of metrics) {
      const variant = m.variantShown || 'Unknown';
      if (!stats[variant]) stats[variant] = { total: 0, attended: 0, stayed60: 0 };
      
      stats[variant].total++;
      
      if (m.registration) {
         const attended = m.registration.attended;
         if (attended) stats[variant].attended++;
         
         // Fix: Handle cases where sessions array might be empty or undefined
         const sessions = m.registration.sessions || [];
         const maxDuration = sessions.reduce((acc, s) => Math.max(acc, s.videoPosition || 0), 0);
         
         if (maxDuration >= 3600) stats[variant].stayed60++;
      }
    }
  } else if (source === 'PageVisit') {
     // Check PageVisits that resulted in a registration
     // Note: PageVisit has registrationId if the user registered during that session
     const visits = await prisma.pageVisit.findMany({
        where: {
            pageType: 'registration',
            registrationId: { not: null }
        },
        include: {
            registration: {
                include: { sessions: true }
            }
        }
     });

     console.log(`Found ${visits.length} converted PageVisit records.`);

     for (const v of visits) {
         // for PageVisit, pageId is likely the variant (LeadPage ID)
         const variant = v.pageId || v.variantGroup || 'Unknown';
         if (!stats[variant]) stats[variant] = { total: 0, attended: 0, stayed60: 0 };
         
         stats[variant].total++;
         
         if (v.registration) {
             const attended = v.registration.attended;
             if (attended) stats[variant].attended++;

             const sessions = v.registration.sessions || [];
             const maxDuration = sessions.reduce((acc, s) => Math.max(acc, s.videoPosition || 0), 0);
             if (maxDuration >= 3600) stats[variant].stayed60++;
         }
     }
  } else if (source === 'Inferred') {
      console.log('Using Registration Test Groups + Webinar Config fallback.');
      
      // Get webinar config map
      const webinars = await prisma.webinar.findMany({
          select: { id: true, regPageAId: true, regPageBId: true }
      });
      console.log('Webinar Config Map:', webinars);
      
      const webinarMap = {}; // webinarId -> { A: id, B: id }
      webinars.forEach(w => {
          webinarMap[w.id] = { A: w.regPageAId, B: w.regPageBId };
      });
      
      const registrations = await prisma.registration.findMany({
          include: { sessions: true },
          orderBy: { registeredAt: 'desc' }
      });
      
      console.log(`Found ${registrations.length} registrations to attempt inferring.`);

      // Debug: Check SplitTests
      const splitTests = await prisma.splitTest.findMany({
          include: { variants: { include: { leadPage: true } } }
      });
      console.log('Active Split Tests:', JSON.stringify(splitTests, null, 2));
      
      let unknownCount = 0;
      for (const reg of registrations) {
          const config = webinarMap[reg.webinarId];
          let variant = 'Unknown';
          
          if (config && reg.testGroup) {
               variant = config[reg.testGroup] || `Group ${reg.testGroup} (No Page ID declared in Webinar)`;
          } else if (reg.testGroup) {
              variant = `Group ${reg.testGroup}`;
          }
          
          if (variant === 'Unknown') {
              unknownCount++;
              if (unknownCount <= 5) console.log(`Reg ${reg.id} is Unknown. testGroup: ${reg.testGroup}, webinarId: ${reg.webinarId}`);
          }
          
         if (!stats[variant]) stats[variant] = { total: 0, attended: 0, stayed60: 0 };
         
         stats[variant].total++;
         
         if (reg.attended) stats[variant].attended++;

         const sessions = reg.sessions || [];
         const maxDuration = sessions.reduce((acc, s) => Math.max(acc, s.videoPosition || 0), 0);
         if (maxDuration >= 3600) stats[variant].stayed60++;
      }
  }

  // 3. Output Results
  console.log('\n--- SPLIT TEST ANALYSIS RESULTS ---');
  console.table(Object.entries(stats).map(([variant, data]) => ({
      Variant: variant,
      Registrations: data.total,
      Attendees: data.attended,
      "Retention > 60m": data.stayed60,
      "Attn %": Math.round((data.attended/data.total)*100) + '%',
      "Retn % (of Attn)": data.attended ? Math.round((data.stayed60/data.attended)*100) + '%' : '0%'
  })));
}


main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
