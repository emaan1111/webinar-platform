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

  // Track views
  await prisma.leadPage.update({
    where: { id: leadPage.id },
    data: { views: { increment: 1 } }
  });

  if (leadPage.type === 'CUSTOM') {
    // Check if it's a full HTML document (contains html tag or doctype)
    const isFullPage = leadPage.htmlContent?.toLowerCase().includes('<html') || 
                       leadPage.htmlContent?.toLowerCase().includes('<!doctype');

    if (isFullPage) {
        return (
            <div className="fixed inset-0 z-[100] bg-white">
                 <iframe 
                    srcDoc={leadPage.htmlContent || ''}
                    className="w-full h-full border-0"
                    title={leadPage.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                 />
            </div>
        );
    }

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
