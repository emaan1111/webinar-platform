import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getVisitorTestGroup, getTestConfiguration } from '@/lib/abTesting';
import { trackPageViewFromRequest } from '@/lib/abTracking';
import WebinarRegisterPage from './page-client';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function WebinarRegisterServerPage({ params }: PageProps) {
  const { slug } = params;
  
  try {
    // Fetch webinar with A/B testing configuration - optimized query
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        duration: true,
        videoUrl: true,
        vimeoVideoId: true,
        registrationPageId: true,
        enableABTesting: true,
        testRegistrationPage: true,
        regPageAId: true,
        regPageBId: true,
        testSchedule: true,
        scheduleAIds: true,
        scheduleBIds: true,
        testVideo: true,
        videoAId: true,
        videoBId: true,
        testOffer: true,
        offerAId: true,
        offerBId: true,
        trafficSplitPercent: true,
        maxSchedulesToShow: true,
        schedules: {
          select: {
            id: true,
            scheduleType: true,
            scheduledAt: true,
            minutesFromReg: true,
            timezone: true,
            useUserTimezone: true,
            recurringPattern: true,
          },
        },
      },
    });

    if (!webinar) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-xl text-gray-600">Webinar not found</p>
          </div>
        </div>
      );
    }

    // Get visitor test group if A/B testing is enabled
    let testGroup: 'A' | 'B' | null = null;
    let testConfig = null;
    let registrationPage = null;
    let activeOffer = null;

    if (webinar.enableABTesting) {
      testGroup = await getVisitorTestGroup(webinar.id, webinar.trafficSplitPercent);
      testConfig = getTestConfiguration(webinar, testGroup);

      // Track page view with all active test elements
      const activeElements: Array<{ element: 'registration' | 'schedule' | 'offer' | 'video'; variantShown: string }> = [];
      
      if (webinar.testRegistrationPage && testConfig.registrationPageId) {
        activeElements.push({
          element: 'registration',
          variantShown: testConfig.registrationPageId,
        });
      }
      
      if (webinar.testSchedule && testConfig.scheduleIds.length > 0) {
        activeElements.push({
          element: 'schedule',
          variantShown: testConfig.scheduleIds.join(','),
        });
      }
      
      if (webinar.testOffer && testConfig.offerId) {
        activeElements.push({
          element: 'offer',
          variantShown: testConfig.offerId,
        });
      }
      
      if (webinar.testVideo && testConfig.videoId) {
        activeElements.push({
          element: 'video',
          variantShown: testConfig.videoId,
        });
      }

      // Track page view (non-blocking)
      if (activeElements.length > 0) {
        const headersList = await headers();
        trackPageViewFromRequest(webinar.id, testGroup, activeElements, headersList).catch(() => {
          // Silent fail - don't block page render
        });
      }

      // Parallel fetch registration page and offer if testing
      const fetchPromises: Promise<any>[] = [];
      
      if (webinar.testRegistrationPage && testConfig.registrationPageId) {
        fetchPromises.push(
          prisma.registrationPage.findUnique({
            where: { id: testConfig.registrationPageId },
          })
        );
      } else if (webinar.registrationPageId) {
        fetchPromises.push(
          prisma.registrationPage.findUnique({
            where: { id: webinar.registrationPageId },
          })
        );
      } else {
        fetchPromises.push(Promise.resolve(null));
      }

      if (webinar.testOffer && testConfig.offerId) {
        fetchPromises.push(
          prisma.offer.findUnique({
            where: { id: testConfig.offerId },
          })
        );
      } else {
        fetchPromises.push(Promise.resolve(null));
      }

      const [regPage, offer] = await Promise.all(fetchPromises);
      registrationPage = regPage;
      activeOffer = offer;
    } else {
      // Load default registration page if specified
      if (webinar.registrationPageId) {
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: webinar.registrationPageId },
        });
      }
    }

    // Filter schedules based on test group
    const allSchedules = webinar.schedules as any[];
    let filteredSchedules: any[] = allSchedules;
    if (webinar.enableABTesting && webinar.testSchedule && testConfig) {
      const scheduleIds: string[] = testConfig.scheduleIds;
      if (scheduleIds.length > 0) {
        filteredSchedules = allSchedules.filter((s: any) => (scheduleIds as string[]).includes(s.id));
      }
    }

    // Prepare video URL based on test group
    let videoUrl = webinar.videoUrl;
    let vimeoVideoId = webinar.vimeoVideoId;
    
    if (webinar.enableABTesting && webinar.testVideo && testConfig?.videoId) {
      // testConfig.videoId could be either a Vimeo ID or full URL
      const videoId = testConfig.videoId;
      if (videoId.startsWith('http')) {
        videoUrl = videoId;
        vimeoVideoId = null;
      } else {
        vimeoVideoId = videoId;
        videoUrl = null;
      }
    }

    // Prepare webinar data for client
    const webinarData = {
      id: webinar.id,
      slug: webinar.slug,
      title: webinar.title,
      description: webinar.description,
      duration: webinar.duration,
      schedules: filteredSchedules,
      maxSchedulesToShow: webinar.maxSchedulesToShow,
      videoUrl,
      vimeoVideoId,
      offer: activeOffer,
      enableABTesting: webinar.enableABTesting,
      testGroup,
    };

    return (
      <WebinarRegisterPage
        webinarData={webinarData}
        registrationPage={registrationPage}
      />
    );
  } catch (error) {
    console.error('Error loading webinar:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Failed to load webinar</p>
        </div>
      </div>
    );
  }
}
