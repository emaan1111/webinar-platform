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
        // Inject script to preserve tracking parameters (st, v) in links
        const trackingScript = `
          <script>
            (function() {
              try {
                // Try references to parent if in iframe, or self if top
                const search = window.parent !== window ? window.parent.location.search : window.location.search;
                const params = new URLSearchParams(search);
                const st = params.get('st');
                const v = params.get('v');
                
                if (st && v) {
                  document.addEventListener('DOMContentLoaded', function() {
                    document.querySelectorAll('a').forEach(link => {
                      try {
                        const url = new URL(link.href, window.location.origin);
                        // Only add if internal link
                        if (url.origin === window.location.origin || link.getAttribute('href').startsWith('/')) {
                          url.searchParams.set('st', st);
                          url.searchParams.set('v', v);
                          link.href = url.toString();
                        }
                      } catch(e) {}
                    });
                  });
                }
              } catch(e) { console.error('Tracking script error', e); }
            })();
          </script>
        `;
        
        // Insert before closing body tag, or at the end if not found
        let contentWithScript = leadPage.htmlContent || '';
        if (contentWithScript.includes('</body>')) {
          contentWithScript = contentWithScript.replace('</body>', `${trackingScript}</body>`);
        } else {
          contentWithScript += trackingScript;
        }

        return (
            <div className="fixed inset-0 z-[100] bg-white">
                 <iframe 
                    srcDoc={contentWithScript}
                    className="w-full h-full border-0"
                    title={leadPage.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                 />
            </div>
        );
    }

    // For non-full page custom HTML (embedded in layout)
    // We can't easily inject script here as it's dangerouslySetInnerHTML.
    // Instead we can use a client component wrapper or just useEffect in a wrapper.
    // But since "dangerouslySetInnerHTML" is static, we can append a script tag string.
    
    const trackingScript = `
      <script>
        (function() {
            try {
                const params = new URLSearchParams(window.location.search);
                const st = params.get('st');
                const v = params.get('v');
                // Also get leadPageId if present (for single lead page tracking)
                const LeadPageId = '${leadPage.id}'; 

                if (st && v) {
                    // Update Links
                    const links = document.getElementById('custom-content-root').querySelectorAll('a');
                    links.forEach(link => {
                        // Only update internal links or links to our domain
                        if (link.href.startsWith(window.location.origin) || link.getAttribute('href').startsWith('/')) {
                            try {
                                const url = new URL(link.href, window.location.origin);
                                url.searchParams.set('st', st);
                                url.searchParams.set('v', v);
                                link.href = url.toString();
                            } catch (e) {}
                        }
                    });

                    // Update Iframes (Inline Embeds)
                    const iframes = document.getElementById('custom-content-root').querySelectorAll('iframe');
                    iframes.forEach(iframe => {
                         try {
                            const src = iframe.src;
                            if (src && (src.startsWith(window.location.origin) || src.startsWith('/'))) {
                                const url = new URL(src, window.location.origin);
                                url.searchParams.set('st', st);
                                url.searchParams.set('v', v);
                                iframe.src = url.toString();
                            }
                         } catch (e) {}
                    });
                }
                
                // Always append leadPageId to links/iframes if valid
                if (LeadPageId) {
                     const frames = document.getElementById('custom-content-root').querySelectorAll('iframe');
                     frames.forEach(frame => {
                        try {
                            const url = new URL(frame.src, window.location.origin);
                            // Only set if not already set (e.g. by st/v logic above, though st/v logic doesn't set lp)
                            if (!url.searchParams.has('lp') && !url.searchParams.has('leadPageId')) {
                                url.searchParams.set('lp', LeadPageId);
                                frame.src = url.toString();
                            }
                        } catch(e) {}
                     });
                     
                     const links = document.getElementById('custom-content-root').querySelectorAll('a');
                     links.forEach(link => {
                        try {
                             // Only internal
                             if (link.href.startsWith(window.location.origin) || link.getAttribute('href').startsWith('/')) {
                                const url = new URL(link.href, window.location.origin);
                                if (!url.searchParams.has('lp') && !url.searchParams.has('leadPageId')) {
                                    url.searchParams.set('lp', LeadPageId);
                                    link.href = url.toString();
                                }
                             }
                        } catch(e) {}
                     });
                }

            } catch(e) {}
        })();
      </script>
    `;

    return (
      <div id="custom-content-root">
        <div dangerouslySetInnerHTML={{ __html: (leadPage.htmlContent || '') + trackingScript }} />
      </div>
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
        leadPageId={leadPage.id}
        />
    );
  }
  
  return <div>Unknown page type</div>;
}
