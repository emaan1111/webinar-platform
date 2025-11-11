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
  
  console.log('=== REGISTRATION PAGE LOADING START ===');
  console.log('Slug:', slug);
  
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

    console.log('📝 Webinar found:', webinar.title);
    console.log('🆔 Webinar ID:', webinar.id);
    console.log('🔧 A/B Testing enabled:', webinar.enableABTesting);
    console.log('📄 Registration Page ID:', webinar.registrationPageId);

    // Get visitor test group if A/B testing is enabled
    let testGroup: 'A' | 'B' | null = null;
    let testConfig = null;
    let registrationPage = null;

    if (webinar.enableABTesting) {
      console.log('🧪 A/B Testing is ENABLED');
      testGroup = await getVisitorTestGroup(webinar.id, webinar.trafficSplitPercent);
      testConfig = getTestConfiguration(webinar, testGroup);
      console.log('👥 Test Group:', testGroup);
      console.log('⚙️ Test Registration Page:', webinar.testRegistrationPage);

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
        trackPageViewFromRequest(webinar.id, testGroup, activeElements, headersList).catch(err => {
          console.error('Failed to track page view:', err);
        });
      }

      // Load registration page if testing
      if (webinar.testRegistrationPage && testConfig.registrationPageId) {
        console.log('📄 Loading A/B test registration page:', testConfig.registrationPageId);
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: testConfig.registrationPageId },
        });
      } else if (webinar.registrationPageId) {
        // Even with A/B testing enabled, if not testing registration page, use the default one
        console.log('📄 Loading default registration page (A/B testing enabled but not testing reg page):', webinar.registrationPageId);
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: webinar.registrationPageId },
        });
      }
    } else {
      // Load default registration page if specified
      console.log('🔍 Checking for registration page. registrationPageId:', webinar.registrationPageId);
      if (webinar.registrationPageId) {
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: webinar.registrationPageId },
        });
        console.log('✅ Registration page fetched:', registrationPage ? registrationPage.name : 'NULL');
      } else {
        console.log('⚠️ No registrationPageId set on webinar');
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
