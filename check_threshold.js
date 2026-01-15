
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WEBINAR_ID = 'cmkf76kdp00ixjw83w77brbdp';

async function main() {
  const webinar = await prisma.webinar.findUnique({
    where: { id: WEBINAR_ID },
    select: {
      title: true,
      duration: true, // in minutes
      videoDuration: true, // in seconds (actual video length)
      mostlyAttendedThreshold: true, // in seconds
      mostlyAttendedTag: true,
      partlyAttendedTag: true,
      attendedTag: true
    }
  });

  console.log('Webinar Config:', webinar);
  
  if (webinar) {
      const durationSec = webinar.duration * 60;
      const threshold = webinar.mostlyAttendedThreshold;
      
      console.log(`\nAnalysis:`);
      console.log(`- Scheduled Duration: ${webinar.duration} mins (${durationSec} seconds)`);
      if (webinar.videoDuration) {
          console.log(`- Actual Video Duration: ${webinar.videoDuration} seconds`);
      }
      console.log(`- Threshold for 'Mostly Attended': ${threshold} seconds`);
      
      if (threshold) {
          const percentOfScheduled = (threshold / durationSec) * 100;
          console.log(`- Threshold requires watching ${percentOfScheduled.toFixed(2)}% of scheduled time`);
          
          if (webinar.videoDuration) {
              const percentOfVideo = (threshold / webinar.videoDuration) * 100;
              console.log(`- Threshold requires watching ${percentOfVideo.toFixed(2)}% of video content`);
          }
      } else {
          console.log(`- No threshold set! Everyone who joins gets 'Attended' (or fallbacks).`);
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
