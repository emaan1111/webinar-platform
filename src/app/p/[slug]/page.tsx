import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
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
                    leadPageId: '${leadPage.id}',
                    appOrigin: '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}'
                };
                
                // Helper to add tracking params to a URL
                function addTrackingToUrl(urlStr) {
                    try {
                        const tracking = window.__WEBINAR_TRACKING__;
                        // Parse the URL - handle both absolute and relative URLs
                        let url;
                        if (urlStr.startsWith('http')) {
                            url = new URL(urlStr);
                        } else if (urlStr.startsWith('/')) {
                            // Use injected app origin for relative URLs (srcDoc has null origin)
                            url = new URL(urlStr, tracking.appOrigin);
                        } else {
                            return urlStr; // Don't modify data: URLs, etc.
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
                
                // Also intercept setAttribute for iframes (React uses this)
                const originalSetAttribute = HTMLIFrameElement.prototype.setAttribute;
                HTMLIFrameElement.prototype.setAttribute = function(name, value) {
                    if (name === 'src' && value) {
                        const modifiedUrl = addTrackingToUrl(value);
                        console.log('🎯 Tracking: Iframe setAttribute intercepted', value, '->', modifiedUrl);
                        return originalSetAttribute.call(this, name, modifiedUrl);
                    }
                    return originalSetAttribute.call(this, name, value);
                };
                
                // Intercept fetch calls to inject tracking params into registration API calls
                const originalFetch = window.fetch;
                window.fetch = function(url, options) {
                    try {
                        const urlStr = typeof url === 'string' ? url : url.toString();
                        // Check if this is a registration API call (Webinar OR Event)
                        if ((urlStr.includes('/api/webinars/') || urlStr.includes('/api/events/')) && urlStr.includes('/register') && options?.method === 'POST') {
                            const body = options.body ? JSON.parse(options.body) : {};
                            // Inject tracking params if not already present
                            if (!body.splitTestId && window.__WEBINAR_TRACKING__.splitTestId) {
                                body.splitTestId = window.__WEBINAR_TRACKING__.splitTestId;
                            }
                            // API expects splitTestVariantId, not variantId
                            if (!body.splitTestVariantId && window.__WEBINAR_TRACKING__.variantId) {
                                body.splitTestVariantId = window.__WEBINAR_TRACKING__.variantId;
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
                                if (src) {
                                    // Handle both absolute and relative URLs
                                    let url;
                                    if (src.startsWith('http')) {
                                        url = new URL(src);
                                    } else if (src.startsWith('/')) {
                                        // For srcDoc iframes, window.location.origin might be 'null'
                                        // In that case, we need to construct the URL differently
                                        const origin = window.location.origin !== 'null' 
                                            ? window.location.origin 
                                            : 'http://localhost:3000'; // Fallback for development
                                        url = new URL(src, origin);
                                    } else {
                                        return; // Skip data: URLs, etc.
                                    }
                                    
                                    // Only update if params are missing
                                    const needsUpdate = 
                                        (st && !url.searchParams.has('st')) ||
                                        (v && !url.searchParams.has('v')) ||
                                        (LeadPageId && !url.searchParams.has('lp'));
                                        
                                    if (needsUpdate) {
                                        if (st && !url.searchParams.has('st')) {
                                            url.searchParams.set('st', st);
                                        }
                                        if (v && !url.searchParams.has('v')) {
                                            url.searchParams.set('v', v);
                                        }
                                        if (LeadPageId && !url.searchParams.has('lp')) {
                                            url.searchParams.set('lp', LeadPageId);
                                        }
                                        console.log('🎯 Tracking: Updated iframe src', src, '->', url.toString());
                                        iframe.setAttribute('src', url.toString());
                                    }
                                }
                            } catch(e) { console.error('Error updating iframe', e); }
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
                
                // Use MutationObserver for dynamic content (Popups)
                const observer = new MutationObserver((mutations) => {
                    let shouldUpdate = false;
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            shouldUpdate = true;
                        } else if (mutation.type === 'attributes' && (mutation.target.tagName === 'IFRAME' || mutation.target.tagName === 'A')) {
                           shouldUpdate = true;
                        }
                    });
                    if (shouldUpdate) {
                        updateTracking();
                        // Also broadcast tracking data to iframes via postMessage
                        broadcastTrackingToIframes();
                    }
                });
                
                // Broadcast tracking params to child iframes via postMessage
                // This is needed because srcDoc has null origin, blocking direct parent access
                function broadcastTrackingToIframes() {
                    const tracking = window.__WEBINAR_TRACKING__;
                    if (!tracking.splitTestId && !tracking.variantId) return;
                    
                    document.querySelectorAll('iframe').forEach(iframe => {
                        try {
                            // Send tracking data to iframe via postMessage
                            iframe.contentWindow?.postMessage({
                                type: 'WEBINAR_TRACKING_PARAMS',
                                splitTestId: tracking.splitTestId,
                                variantId: tracking.variantId,
                                leadPageId: tracking.leadPageId
                            }, '*');
                        } catch(e) {}
                    });
                }
                
                // Broadcast initially and on intervals
                setTimeout(broadcastTrackingToIframes, 500);
                setTimeout(broadcastTrackingToIframes, 1000);
                setTimeout(broadcastTrackingToIframes, 2000);
                
                if (document.body) {
                    observer.observe(document.body, { 
                        childList: true, 
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['src', 'href']
                    });
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        observer.observe(document.body, { 
                            childList: true, 
                            subtree: true,
                            attributes: true,
                            attributeFilter: ['src', 'href']
                        });
                    });
                }
                
                const interval = setInterval(updateTracking, 1000);
                setTimeout(() => clearInterval(interval), 30000);
            })();
          </script>
        `;
        
        // Early script to inject tracking params BEFORE React reads window.location.search
        // This goes in <head> so it runs before any other scripts
        const earlyTrackingScript = `
          <script>
            // Inject tracking params early - before React or other frameworks run
            window.__WEBINAR_TRACKING__ = {
                splitTestId: '${splitTestId || ''}' || null,
                variantId: '${variantId || ''}' || null,
                leadPageId: '${leadPage.id}',
                appOrigin: '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}'
            };
            
            // Polyfill URLSearchParams.get to return tracking params in srcDoc iframes
            // This makes React code that reads window.location.search work correctly
            const OriginalURLSearchParams = window.URLSearchParams;
            window.URLSearchParams = function(init) {
                const instance = new OriginalURLSearchParams(init);
                const originalGet = instance.get.bind(instance);
                
                instance.get = function(name) {
                    const result = originalGet(name);
                    if (result) return result;
                    
                    // If no result and we're in srcDoc, return tracking params
                    const tracking = window.__WEBINAR_TRACKING__;
                    if (tracking) {
                        if (name === 'st' || name === 'splitTestId') return tracking.splitTestId;
                        if (name === 'v' || name === 'splitTestVariantId') return tracking.variantId;
                        if (name === 'lp' || name === 'leadPageId') return tracking.leadPageId;
                    }
                    return result;
                };
                
                return instance;
            };
            window.URLSearchParams.prototype = OriginalURLSearchParams.prototype;
            Object.setPrototypeOf(window.URLSearchParams, OriginalURLSearchParams);
            
            console.log('🎯 Early Tracking: Injected params and URLSearchParams polyfill', window.__WEBINAR_TRACKING__);
          </script>
        `;
        
        // Insert early script into <head> and main script before </body>
        let contentWithScript = leadPage.htmlContent || '';
        
        // Insert early tracking script into head
        if (contentWithScript.includes('</head>')) {
          contentWithScript = contentWithScript.replace('</head>', `${earlyTrackingScript}</head>`);
        } else if (contentWithScript.includes('<body')) {
          contentWithScript = contentWithScript.replace('<body', `${earlyTrackingScript}<body`);
        } else {
          contentWithScript = earlyTrackingScript + contentWithScript;
        }
        
        // Insert main tracking script before closing body tag
        if (contentWithScript.includes('</body>')) {
          contentWithScript = contentWithScript.replace('</body>', `${trackingScript}</body>`);
        } else {
          contentWithScript += trackingScript;
        }
        
        // SERVER-SIDE: Modify all iframe src attributes to include tracking params
        // This ensures tracking works even for static iframes before any JS runs
        if (splitTestId || variantId) {
          // Match iframe src attributes (both single and double quotes)
          contentWithScript = contentWithScript.replace(
            /(<iframe[^>]*\ssrc=["'])([^"']+)(["'][^>]*>)/gi,
            (match, prefix, url, suffix) => {
              try {
                // Only modify URLs that contain embed-event or embed-modal or embed/
                if (url.includes('embed-event') || url.includes('embed-modal') || url.includes('/embed/')) {
                  const urlObj = new URL(url);
                  if (splitTestId && !urlObj.searchParams.has('st')) {
                    urlObj.searchParams.set('st', splitTestId);
                  }
                  if (variantId && !urlObj.searchParams.has('v')) {
                    urlObj.searchParams.set('v', variantId);
                  }
                  if (!urlObj.searchParams.has('lp')) {
                    urlObj.searchParams.set('lp', leadPage.id);
                  }
                  console.log('Server-side iframe src modification:', url, '->', urlObj.toString());
                  return prefix + urlObj.toString() + suffix;
                }
              } catch (e) {
                // URL parsing failed, return original
              }
              return match;
            }
          );
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
                    
                    try {
                        // Handle relative URLs by using window.location.origin as base
                        url = new URL(urlStr, window.location.origin);
                    } catch (e) {
                         // Fallback for invalid URLs
                         return urlStr;
                    }
                    
                    // Add tracking params if they exist (st/v/lp)
                    // Check if they are already present to avoid overriding user intent? 
                    // Usually we want to FORCE tracking params for consistency.
                    
                    if (tracking.splitTestId && !url.searchParams.has('st')) {
                        url.searchParams.set('st', tracking.splitTestId);
                    }
                    if (tracking.variantId && !url.searchParams.has('v')) {
                        url.searchParams.set('v', tracking.variantId);
                    }
                    if (tracking.leadPageId && !url.searchParams.has('lp')) {
                        url.searchParams.set('lp', tracking.leadPageId);
                    }
                    
                    // console.log('🔗 Tracking: Modified URL', urlStr, '->', url.toString());
                    
                    // Return absolute URL or path depending on input?
                    // URL object toString() is always absolute.
                    // If input was relative, we might want to return relative, but absolute is safer for iframes.
                    return url.toString();
                } catch(e) {
                    // console.error('Error adding tracking to URL:', e);
                    return urlStr;
                }
            }
            
            // Intercept iframe src setter to add tracking params
            // Note: This might cause issues with some frameworks if not careful, but needed for programmatic updates
            try {
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
                    // console.log('🎯 Tracking: Iframe src setter intercepted');
                }
                
                // Also intercept setAttribute for iframes (React uses this)
                const originalSetAttribute = HTMLIFrameElement.prototype.setAttribute;
                HTMLIFrameElement.prototype.setAttribute = function(name, value) {
                    if (name === 'src' && value) {
                        const modifiedUrl = addTrackingToUrl(value);
                        return originalSetAttribute.call(this, name, modifiedUrl);
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            } catch(e) {}
            
            // Intercept fetch calls to inject tracking params into registration API calls
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                try {
                    const urlStr = typeof url === 'string' ? url : url.toString();
                    // Check if this is a registration API call (Webinar OR Event)
                    if ((urlStr.includes('/api/webinars/') || urlStr.includes('/api/events/')) && urlStr.includes('/register') && options?.method === 'POST') {
                        const body = options.body ? JSON.parse(options.body) : {};
                        // Inject tracking params if not already present
                        if (!body.splitTestId && window.__WEBINAR_TRACKING__.splitTestId) {
                            body.splitTestId = window.__WEBINAR_TRACKING__.splitTestId;
                        }
                        // API expects splitTestVariantId, not variantId
                        if (!body.splitTestVariantId && window.__WEBINAR_TRACKING__.variantId) {
                            body.splitTestVariantId = window.__WEBINAR_TRACKING__.variantId;
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

                    // Update Links
                    document.querySelectorAll('a').forEach(link => {
                        try {
                            const href = link.getAttribute('href');
                            if (href) {
                                // Use the same helper for consistency
                                const newHref = addTrackingToUrl(href);
                                if (href !== newHref) {
                                    link.href = newHref;
                                }
                            }
                        } catch (e) {}
                    });

                    // Update Iframes
                    document.querySelectorAll('iframe').forEach(iframe => {
                         try {
                            const src = iframe.getAttribute('src');
                            if (src) {
                                const newSrc = addTrackingToUrl(src);
                                // Only update if changed to avoid reload loops
                                try {
                                    // Use URL object comparison to ignore parameter order differences if needed
                                    // but string comparison is mostly fine given our helper format
                                    const currentUrl = new URL(src, window.location.origin);
                                    const newUrl = new URL(newSrc, window.location.origin);
                                    
                                    // Check if key params are missing
                                    const needsUpdate = 
                                        (st && !currentUrl.searchParams.has('st')) ||
                                        (v && !currentUrl.searchParams.has('v')) ||
                                        (LeadPageId && !currentUrl.searchParams.has('lp'));
                                        
                                    if (needsUpdate) {
                                        iframe.setAttribute('src', newSrc);
                                    }
                                } catch(err) {
                                    // Fallback to simple string check if URL parsing fails
                                    if(src !== newSrc) {
                                        iframe.setAttribute('src', newSrc);
                                    }
                                }
                            }
                         } catch (e) {}
                    });
                } catch(e) {
                    // console.error('Tracking Error:', e);
                }
            }
            
            // Run immediately
            updateTracking();
            
            // Broadcast tracking params to child iframes via postMessage
            function broadcastTrackingToIframes() {
                const tracking = window.__WEBINAR_TRACKING__;
                if (!tracking.splitTestId && !tracking.variantId) return;
                
                document.querySelectorAll('iframe').forEach(iframe => {
                    try {
                        iframe.contentWindow?.postMessage({
                            type: 'WEBINAR_TRACKING_PARAMS',
                            splitTestId: tracking.splitTestId,
                            variantId: tracking.variantId,
                            leadPageId: tracking.leadPageId
                        }, '*');
                    } catch(e) {}
                });
            }
            
            // Broadcast after iframe loads
            setTimeout(broadcastTrackingToIframes, 500);
            setTimeout(broadcastTrackingToIframes, 1000);
            setTimeout(broadcastTrackingToIframes, 2000);
            
            // Use MutationObserver for dynamic content (Popups)
            const observer = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        shouldUpdate = true;
                    } else if (mutation.type === 'attributes' && (mutation.target.tagName === 'IFRAME' || mutation.target.tagName === 'A')) {
                       // Avoid infinite loop if we just updated it
                       // Check if the update was ours? Hard to tell. 
                       // But updateTracking() checks before updating, so it's safe.
                       shouldUpdate = true;
                    }
                });
                if (shouldUpdate) {
                    updateTracking();
                    broadcastTrackingToIframes();
                }
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'href']
            });
            
            // Still keep a fallback interval just in case
            // window.addEventListener('load', updateTracking);
            // const interval = setInterval(updateTracking, 2000);
            // setTimeout(() => clearInterval(interval), 30000);
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
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <WebinarRegisterPage
            webinarData={webinarData}
            registrationPage={leadPage.template}
            leadPageId={leadPage.id}
            splitTestId={splitTestId}
            variantId={variantId}
            />
        </Suspense>
    );
  }
  
  return <div>Unknown page type</div>;
}
