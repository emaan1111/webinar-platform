import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WebinarRegisterPage from '../../w/[slug]/page-client';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function LeadPage({ params }: PageProps) {
  const { slug } = params;

  const leadPage = await prisma.leadPage.findUnique({
    where: { slug },
    include: {
      template: true,
      webinar: {
        select: {
          id: true,
          slug: true,
          maxSchedulesToShow: true,
          roundJITTo15Minutes: true,
          enableABTesting: true,
        }
      }
    }
  });

  if (!leadPage) {
    notFound();
  }

  if (leadPage.type === 'CUSTOM') {
    return (
      <div dangerouslySetInnerHTML={{ __html: leadPage.htmlContent || '' }} />
    );
  }

  // If TEMPLATE
  if (leadPage.type === 'TEMPLATE') {
     if (!leadPage.webinar) {
        return <div>Configuration Error: No linked webinar found for this template page.</div>;
    }
    
    // Pass the registration page template explicitly
    // Note: page-client expects 'registrationPage' prop
    
    const webinarData = {
        id: leadPage.webinar.id,
        slug: leadPage.webinar.slug,
        maxSchedulesToShow: leadPage.webinar.maxSchedulesToShow,
        roundJITTo15Minutes: leadPage.webinar.roundJITTo15Minutes,
        enableABTesting: false,
        testGroup: null,
        activeElements: [],
    };

    return (
        <WebinarRegisterPage
        webinarData={webinarData}
        registrationPage={leadPage.template}
        />
    );
  }
  
  return <div>Unknown page type</div>;
}
