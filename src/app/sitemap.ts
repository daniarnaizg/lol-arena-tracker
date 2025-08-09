import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/metadata'

// Next.js App Router sitemap generator
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, '')
  const now = new Date().toISOString()
  // Static routes; expand if you add more pages later
  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
