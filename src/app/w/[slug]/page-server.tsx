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
    // Fetch webinar with A/B testing configuration
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      include: {
        schedules: true,
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
    let registrationTemplate = null;

    if (webinar.enableABTesting) {
      testGroup = await getVisitorTestGroup(webinar.id, webinar.trafficSplitPercent);
      testConfig = getTestConfiguration(webinar, testGroup);

      // Track page view with all active test elements
      const activeElements: Array<{ element: 'registration' | 'schedule' | 'offer' | 'video'; variantShown: string }> = [];
      
      if (webinar.testRegistrationPage && testConfig.registrationTemplateId) {
        activeElements.push({
          element: 'registration',
          variantShown: testConfig.registrationTemplateId,
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
        trackPageViewFromRequest(webinar.id, testGroup, activeElements, headersList).catch(err => {
          console.error('Failed to track page view:', err);
        });
      }

      // Load registration template if testing
      if (webinar.testRegistrationPage && testConfig.registrationTemplateId) {
        registrationTemplate = await prisma.template.findUnique({
          where: { id: testConfig.registrationTemplateId },
          select: {
            id: true,
            name: true,
            htmlCode: true,
          },
        });
      }
    } else {
      // Load default template if specified
      if (webinar.registrationTemplateId) {
        registrationTemplate = await prisma.template.findUnique({
          where: { id: webinar.registrationTemplateId },
          select: {
            id: true,
            name: true,
            htmlCode: true,
          },
        });
      }
    }

    // Filter schedules based on test group
    let filteredSchedules: any[] = webinar.schedules;
    if (webinar.enableABTesting && webinar.testSchedule && testConfig) {
      const scheduleIds = testConfig.scheduleIds;
      if (scheduleIds.length > 0) {
        filteredSchedules = webinar.schedules.filter((s: any) => scheduleIds.includes(s.id));
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

    // Prepare offer data based on test group
    let activeOffer = null;
    if (webinar.enableABTesting && webinar.testOffer && testConfig?.offerId) {
      activeOffer = await prisma.offer.findUnique({
        where: { id: testConfig.offerId },
      });
    }

    // Prepare webinar data for client
    console.log('🔧 SERVER: Preparing webinar data:', {
      id: webinar.id,
      slug: webinar.slug,
      maxSchedulesToShow: webinar.maxSchedulesToShow,
      schedulesCount: filteredSchedules.length
    });
    
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
        registrationPage={registrationTemplate}
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
