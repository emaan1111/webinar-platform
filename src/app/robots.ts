import type { MetadataRoute } from 'next';

// OpenAI reviews ad landing pages with OAI-AdsBot, and asks advertisers to allow it
// (and OAI-SearchBot) by name. Cloudflare prepends its own managed header to this file.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'OAI-AdsBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: '*', allow: '/' },
    ],
  };
}
