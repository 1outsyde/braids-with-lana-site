import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://braidsbyLana.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://braidsbyLana.com/book', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://braidsbyLana.com/services', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://braidsbyLana.com/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
