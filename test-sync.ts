import { prisma } from './src/lib/prisma';
import { getWebinarRegistrants } from './src/lib/webinarjam';

async function main() {
  const ews = await prisma.externalWebinar.findMany();
  for (const ew of ews) {
    console.log(`Checking ${ew.name} (${ew.externalWebinarId})`);
    const data = await getWebinarRegistrants(ew.externalWebinarId, { platform: ew.platform as any, dateRange: 8 });
    console.log(`Found ${data.registrants.length} registrants`);
  }
}
main();
