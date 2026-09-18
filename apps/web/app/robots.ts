import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/projects', '/login', '/signup'],
    },
    sitemap: 'https://get-pulsekit.vercel.app/sitemap.xml',
  }
}