import type { Metadata } from 'next';
import type { Locale } from './i18n';
import { HREFLANG, LOCALES, T } from './i18n';
import { SITE, absoluteUrl, localePath } from './site';
import type { PostMeta } from './blog';

/**
 * Строит alternates c hreflang для всех локалей.
 * `paths` задаёт путь внутри локали (для статей он может отличаться по языкам).
 */
export function buildAlternates(paths: Record<Locale, string | null>, current: Locale) {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    const localePathValue = paths[locale];
    if (localePathValue !== null) {
      languages[HREFLANG[locale]] = absoluteUrl(localePath(locale, localePathValue));
    }
  }
  const currentPath = paths[current];
  const xDefault = paths.ru ?? paths.en;
  if (xDefault !== null && xDefault !== undefined) {
    languages['x-default'] = absoluteUrl(localePath('ru', xDefault));
  }

  return {
    canonical: currentPath === null ? undefined : absoluteUrl(localePath(current, currentPath ?? '')),
    languages,
  };
}

export function samePathAlternates(path: string, current: Locale) {
  return buildAlternates({ ru: path, en: path }, current);
}

type OpenGraphImage = { url: string; width: number; height: number; alt: string };

export function ogImage(title: string, alt?: string): OpenGraphImage[] {
  return [
    {
      url: absoluteUrl(`/api/og?title=${encodeURIComponent(title)}`),
      width: 1200,
      height: 630,
      alt: alt ?? title,
    },
  ];
}

export function baseMetadata(locale: Locale, overrides: Partial<Metadata> = {}): Metadata {
  const dict = T[locale];
  return {
    metadataBase: new URL(SITE.url),
    openGraph: {
      siteName: dict.brand,
      locale: HREFLANG[locale].replace('-', '_'),
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
    ...overrides,
  };
}

/* --------------------------------- JSON-LD -------------------------------- */

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

export function organizationJsonLd(locale: Locale) {
  const dict = T[locale];
  return {
    '@type': 'TravelAgency',
    '@id': ORG_ID,
    name: dict.brand,
    description: dict.tagline,
    url: absoluteUrl(localePath(locale)),
    telephone: SITE.phone,
    email: SITE.email,
    foundingDate: String(SITE.foundingYear),
    priceRange: '₽₽',
    sameAs: [...SITE.social],
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.address.geo.lat,
      longitude: SITE.address.geo.lng,
    },
    areaServed: { '@type': 'City', name: locale === 'ru' ? 'Москва' : 'Moscow' },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '21:00',
    },
  };
}

export function websiteJsonLd(locale: Locale) {
  const dict = T[locale];
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: dict.brand,
    url: absoluteUrl(localePath(locale)),
    inLanguage: HREFLANG[locale],
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl(localePath(locale, 'blog?q={search_term_string}')),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(post: PostMeta, url: string) {
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    inLanguage: HREFLANG[post.locale],
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    articleSection: post.category,
    keywords: post.tags.join(', '),
    wordCount: post.readingMinutes * 180,
    timeRequired: `PT${post.readingMinutes}M`,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.cover ? { image: absoluteUrl(post.cover) } : {}),
  };
}

/**
 * FAQPage — один из самых сильных сигналов и для обычной выдачи (rich results),
 * и для ответных движков вроде ChatGPT Search и Perplexity.
 */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function tourJsonLd(
  tour: { name: string; description: string; price: number; duration: string; path: string },
  locale: Locale,
) {
  return {
    '@type': 'TouristTrip',
    name: tour.name,
    description: tour.description,
    url: absoluteUrl(tour.path),
    touristType: locale === 'ru' ? 'Индивидуальные и малые группы' : 'Private and small groups',
    provider: { '@id': ORG_ID },
    offers: {
      '@type': 'Offer',
      price: tour.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(tour.path),
    },
    itinerary: { '@type': 'ItemList', numberOfItems: 1 },
  };
}

/** Оборачивает набор сущностей в один @graph — так поисковики связывают их между собой. */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
