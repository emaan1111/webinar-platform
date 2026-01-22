import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WebinarRegisterPage from '../../w/[slug]/page-client';

interface PageProps {
  params: {
    slug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LeadPage({ params, searchParams }: PageProps) {
  const { slug } = params;
  
  // Extract tracking parameters from URL
  const splitTestId = typeof searchParams.st === 'string' ? searchParams.st : undefined;
  const variantId = typeof searchParams.v === 'string' ? searchParams.v : undefined;

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
        // Inject script to preserve tracking parameters (st, v, lp) in links and iframes
        // NOTE: For srcDoc iframes, window.parent.location is not accessible due to null origin
        // So we inject the values directly from the server
        const trackingScript = `
          <script>
            (function() {
                // Server-injected tracking params - available globally
                window.__WEBINAR_TRACKING__ = {
                    splitTestId: '${splitTestId || ''}' || null,
                    variantId: '${variantId || ''}' || null,
                    leadPageId: '${leadPage.id}'
                };
                
                // Helper to add tracking params to a URL
                function addTrackingToUrl(urlStr) {
                    try {
                        const tracking = window.__WEBINAR_TRACKING__;
                        // Parse the URL - handle both absolute and relative URLs
                        let url;
                        if (urlStr.startsWith('http')) {
                            url = new URL(urlStr);
                        } else {
                            return urlStr; // Don't modify relative URLs without origin context
                        }
                        
                        // Add tracking params if they exist
                        if (tracking.splitTestId && !url.searchParams.has('st')) {
                            url.searchParams.set('st', tracking.splitTestId);
                        }
                        if (tracking.variantId && !url.searchParams.has('v')) {
                            url.searchParams.set('v', tracking.variantId);
                        }
                        if (tracking.leadPageId && !url.searchParams.has('lp')) {
                            url.searchParams.set('lp', tracking.leadPageId);
                        }
                        console.log('🔗 Tracking: Modified URL', urlStr, '->', url.toString());
                        return url.toString();
                    } catch(e) {
                        console.error('Error adding tracking to URL:', e);
                        return urlStr;
                    }
                }
                
                // Intercept iframe src setter to add tracking params
                const iframeSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
                if (iframeSrcDescriptor && iframeSrcDescriptor.set) {
                    Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
                        get: iframeSrcDescriptor.get,
                        set: function(value) {
                            const modifiedUrl = addTrackingToUrl(value);
                            return iframeSrcDescriptor.set.call(this, modifiedUrl);
                        },
                        enumerable: true,
                        configurable: true
                    });
                    console.log('🎯 Tracking: Iframe src setter intercepted');
                }
                
                // Intercept fetch calls to inject tracking params into registration API calls
                const originalFetch = window.fetch;
                window.fetch = function(url, options) {
                    try {
                        const urlStr = typeof url === 'string' ? url : url.toString();
                        // Check if this is a registration API call
                        if (urlStr.includes('/api/webinars/') && urlStr.includes('/register') && options?.method === 'POST') {
                            const body = options.body ? JSON.parse(options.body) : {};
                            // Inject tracking params if not already present
                            if (!body.splitTestId && window.__WEBINAR_TRACKING__.splitTestId) {
                                body.splitTestId = window.__WEBINAR_TRACKING__.splitTestId;
                            }
                            if (!body.variantId && window.__WEBINAR_TRACKING__.variantId) {
                                body.variantId = window.__WEBINAR_TRACKING__.variantId;
                            }
                            if (!body.leadPageId && window.__WEBINAR_TRACKING__.leadPageId) {
                                body.leadPageId = window.__WEBINAR_TRACKING__.leadPageId;
                            }
                            if (!body.privacyConsent) {
                                body.privacyConsent = true;
                            }
                            options.body = JSON.stringify(body);
                            console.log('🔍 Tracking: Injected params into registration', window.__WEBINAR_TRACKING__);
                        }
                    } catch(e) { console.error('Tracking fetch intercept error:', e); }
                    return originalFetch.apply(this, arguments);
                };

                function updateTracking() {
                  try {
                    // Server-injected tracking params (works for srcDoc iframes)
                    const st = window.__WEBINAR_TRACKING__.splitTestId;
                    const v = window.__WEBINAR_TRACKING__.variantId;
                    // LeadPageId from server
                    const LeadPageId = window.__WEBINAR_TRACKING__.leadPageId;
                    
                    if (st && v) {
                        // Update Links
                        document.querySelectorAll('a').forEach(link => {
                          try {
                            const url = new URL(link.href, window.location.origin);
                            // Only add if internal link
                            if (url.origin === window.location.origin || link.getAttribute('href').startsWith('/')) {
                              if(url.searchParams.get('st') !== st) {
                                url.searchParams.set('st', st);
                                url.searchParams.set('v', v);
                                link.href = url.toString();
                              }
                            }
                          } catch(e) {}
                        });

                        // Update Iframes - use setAttribute to avoid our interceptor re-triggering
                        document.querySelectorAll('iframe').forEach(iframe => {
                            try {
                                const src = iframe.getAttribute('src');
                                if (src && src.startsWith('http')) {
                                    const url = new URL(src);
                                    if(!url.searchParams.has('st')) {
                                        url.searchParams.set('st', st);
                                        url.searchParams.set('v', v);
                                        if (LeadPageId && !url.searchParams.has('lp')) {
                                            url.searchParams.set('lp', LeadPageId);
                                        }
                                        iframe.setAttribute('src', url.toString());
                                    }
                                }
                            } catch(e) {}
                        });
                    }

                    // Update LP param for links
                    if (LeadPageId) {
                         document.querySelectorAll('a').forEach(link => {
                            try {
                                 if (link.href && (link.href.startsWith(window.location.origin) || link.getAttribute('href').startsWith('/'))) {
                                    const url = new URL(link.href, window.location.origin);
                                    if (!url.searchParams.has('lp') && !url.searchParams.has('leadPageId')) {
                                        url.searchParams.set('lp', LeadPageId);
                                        link.href = url.toString();
                                    }
                                 }
                            } catch(e) {}
                         });
                    }

                  } catch(e) { console.error('Tracking script error', e); }
                }

                // Run strategies
                updateTracking(); // Immediate
                document.addEventListener('DOMContentLoaded', updateTracking);
                window.addEventListener('load', updateTracking);
                const interval = setInterval(updateTracking, 1000);
                setTimeout(() => clearInterval(interval), 10000);
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
            // Try URL params first, fall back to server-injected values
            const params = new URLSearchParams(window.location.search);
            
            // Server-injected tracking params - available globally
            window.__WEBINAR_TRACKING__ = {
                splitTestId: params.get('st') || '${splitTestId || ''}' || null,
                variantId: params.get('v') || '${variantId || ''}' || null,
                leadPageId: '${leadPage.id}'
            };
            
            // Helper to add tracking params to a URL
            function addTrackingToUrl(urlStr) {
                try {
                    const tracking = window.__WEBINAR_TRACKING__;
                    // Parse the URL - handle both absolute and relative URLs
                    let url;
                    if (urlStr.startsWith('http')) {
                        url = new URL(urlStr);
                    } else {
                        return urlStr; // Don't modify relative URLs without origin context
                    }
                    
                    // Add tracking params if they exist
                    if (tracking.splitTestId && !url.searchParams.has('st')) {
                        url.searchParams.set('st', tracking.splitTestId);
                    }
                    if (tracking.variantId && !url.searchParams.has('v')) {
                        url.searchParams.set('v', tracking.variantId);
                    }
                    if (tracking.leadPageId && !url.searchParams.has('lp')) {
                        url.searchParams.set('lp', tracking.leadPageId);
                    }
                    console.log('🔗 Tracking: Modified URL', urlStr, '->', url.toString());
                    return url.toString();
                } catch(e) {
                    console.error('Error adding tracking to URL:', e);
                    return urlStr;
                }
            }
            
            // Intercept iframe src setter to add tracking params
            const iframeSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
            if (iframeSrcDescriptor && iframeSrcDescriptor.set) {
                Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
                    get: iframeSrcDescriptor.get,
                    set: function(value) {
                        const modifiedUrl = addTrackingToUrl(value);
                        return iframeSrcDescriptor.set.call(this, modifiedUrl);
                    },
                    enumerable: true,
                    configurable: true
                });
                console.log('🎯 Tracking: Iframe src setter intercepted');
            }
            
            // Intercept fetch calls to inject tracking params into registration API calls
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                try {
                    const urlStr = typeof url === 'string' ? url : url.toString();
                    // Check if this is a registration API call
                    if (urlStr.includes('/api/webinars/') && urlStr.includes('/register') && options?.method === 'POST') {
                        const body = options.body ? JSON.parse(options.body) : {};
                        // Inject tracking params if not already present
                        if (!body.splitTestId && window.__WEBINAR_TRACKING__.splitTestId) {
                            body.splitTestId = window.__WEBINAR_TRACKING__.splitTestId;
                        }
                        if (!body.variantId && window.__WEBINAR_TRACKING__.variantId) {
                            body.variantId = window.__WEBINAR_TRACKING__.variantId;
                        }
                        if (!body.leadPageId && window.__WEBINAR_TRACKING__.leadPageId) {
                            body.leadPageId = window.__WEBINAR_TRACKING__.leadPageId;
                        }
                        if (!body.privacyConsent) {
                            body.privacyConsent = true;
                        }
                        options.body = JSON.stringify(body);
                        console.log('🔍 Tracking: Injected params into registration', window.__WEBINAR_TRACKING__);
                    }
                } catch(e) { console.error('Tracking fetch intercept error:', e); }
                return originalFetch.apply(this, arguments);
            };
            
            function updateTracking() {
                try {
                    const st = window.__WEBINAR_TRACKING__.splitTestId;
                    const v = window.__WEBINAR_TRACKING__.variantId;
                    const LeadPageId = window.__WEBINAR_TRACKING__.leadPageId; 

                    if (st && v) {
                        // Update Links
                        document.querySelectorAll('a').forEach(link => {
                            try {
                                if (link.href && (link.href.startsWith(window.location.origin) || link.getAttribute('href').startsWith('/'))) {
                                    const url = new URL(link.href, window.location.origin);
                                    if(url.searchParams.get('st') !== st) {
                                        url.searchParams.set('st', st);
                                        url.searchParams.set('v', v);
                                        link.href = url.toString();
                                    }
                                }
                            } catch (e) {}
                        });

                        // Update Iframes - use setAttribute to avoid our interceptor
                        document.querySelectorAll('iframe').forEach(iframe => {
                             try {
                                const src = iframe.getAttribute('src');
                                if (src && src.startsWith('http')) {
                                    const url = new URL(src);
                                    if(!url.searchParams.has('st')) {
                                        url.searchParams.set('st', st);
                                        url.searchParams.set('v', v);
                                        if (LeadPageId && !url.searchParams.has('lp')) {
                                            url.searchParams.set('lp', LeadPageId);
                                        }
                                        iframe.setAttribute('src', url.toString());
                                    }
                                }
                             } catch (e) {}
                        });
                    }
                    
                    // Always append leadPageId to links if valid
                    if (LeadPageId) {
                         document.querySelectorAll('a').forEach(link => {
                            try {
                                 if (link.href && (link.href.startsWith(window.location.origin) || link.getAttribute('href').startsWith('/'))) {
                                    const url = new URL(link.href, window.location.origin);
                                    if (!url.searchParams.has('lp') && !url.searchParams.has('leadPageId')) {
                                        url.searchParams.set('lp', LeadPageId);
                                        link.href = url.toString();
                                    }
                                 }
                            } catch(e) {}
                         });
                    }
                } catch(e) {
                    console.error('Tracking Error:', e);
                }
            }
            
            // Run immediately
            updateTracking();
            // Run on load
            window.addEventListener('load', updateTracking);
            // Run periodically for a few seconds to catch lazy elements
            const interval = setInterval(updateTracking, 1000);
            setTimeout(() => clearInterval(interval), 10000);
        })();
      </script>
    `;

    // Script to suppress Tailwind CDN warning since we use it for dynamic user content
    const suppressionScript = `
      <script>
        (function(){
            const originalWarn = console.warn;
            console.warn = function(...args) {
                if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) {
                    return;
                }
                originalWarn.apply(console, args);
            };
        })();
      </script>
    `;

    // Inject suppression script and tracking script
    let htmlContent = leadPage.htmlContent || '';
    
    // 1. Inject Suppression Script (Best effort: inside <head>, or at top)
    if (htmlContent.match(/<head>/i)) {
        htmlContent = htmlContent.replace(/<head>/i, `<head>${suppressionScript}`);
    } else {
        htmlContent = suppressionScript + htmlContent;
    }

    // 2. Inject Tracking Script (Best effort: before </body>, or at bottom)
    if (htmlContent.match(/<\/body>/i)) {
        htmlContent = htmlContent.replace(/<\/body>/i, `${trackingScript}</body>`);
    } else {
        htmlContent = htmlContent + trackingScript;
    }

    return (
      <div id="custom-content-root">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
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
        splitTestId={splitTestId}
        variantId={variantId}
        />
    );
  }
  
  return <div>Unknown page type</div>;
}
