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
    // Minimal fetch - only what's needed for initial page render
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        registrationPageId: true,
        enableABTesting: true,
        testRegistrationPage: true,
        regPageAId: true,
        regPageBId: true,
        trafficSplitPercent: true,
        maxSchedulesToShow: true,
        roundJITTo15Minutes: true,
        // Schedules will be fetched on-demand when modal opens
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
    // Track page view with all active test elements
    const activeElements: Array<{ element: 'registration' | 'schedule' | 'offer' | 'video'; variantShown: string }> = [];

    if (webinar.enableABTesting) {
      testGroup = await getVisitorTestGroup(webinar.id, webinar.trafficSplitPercent);
      // @ts-ignore - The webinar object from prisma includes all fields but TS doesn't see them all due to select/include nuance
      testConfig = getTestConfiguration(webinar, testGroup);
      
      if (webinar.testRegistrationPage && testConfig.registrationPageId) {
        activeElements.push({
          element: 'registration',
          variantShown: testConfig.registrationPageId,
        });
      }

      // Track page view moved to client side to improve initial load time
      // The activeElements will be passed to the client component

      // Fetch registration page if testing
      if (webinar.testRegistrationPage && testConfig.registrationPageId) {
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: testConfig.registrationPageId },
        });
      } else if (webinar.registrationPageId) {
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: webinar.registrationPageId },
        });
      }
    } else {
      // Load default registration page if specified
      if (webinar.registrationPageId) {
        registrationPage = await prisma.registrationPage.findUnique({
          where: { id: webinar.registrationPageId },
        });
      }
    }

    // Prepare minimal webinar data for client (schedules loaded on demand)
    const webinarData = {
      id: webinar.id,
      slug: webinar.slug,
      maxSchedulesToShow: webinar.maxSchedulesToShow,
      roundJITTo15Minutes: webinar.roundJITTo15Minutes,
      enableABTesting: webinar.enableABTesting,
      testGroup,
      activeElements: webinar.enableABTesting ? activeElements : [],
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
