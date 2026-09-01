import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { HREFLANG, LOCALES } from '@/lib/i18n';
import { absoluteUrl, localePath } from '@/lib/site';

export const revalidate = 3600;

/** Мультиязычная карта сайта: у каждой записи есть alternates с hreflang. */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const staticPaths: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'yearly' }[] = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: 'blog', priority: 0.9, changeFrequency: 'daily' },
    { path: 'privacy', priority: 0.2, changeFrequency: 'yearly' },
  ];

  for (const locale of LOCALES) {
    for (const item of staticPaths) {
      entries.push({
        url: absoluteUrl(localePath(locale, item.path)),
        lastModified: new Date(),
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((alt) => [HREFLANG[alt], absoluteUrl(localePath(alt, item.path))]),
          ),
        },
      });
    }

    for (const post of getAllPosts(locale)) {
      entries.push({
        url: absoluteUrl(localePath(locale, `blog/${post.slug}`)),
        lastModified: new Date(post.updated ?? post.date),
        changeFrequency: 'monthly',
        priority: post.featured ? 0.8 : 0.7,
      });
    }
  }

  return entries;
}
