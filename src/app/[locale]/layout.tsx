import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { HREFLANG, LOCALES, isLocale, t } from '@/lib/i18n';
import { SITE } from '@/lib/site';
import '@/styles/globals.css';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = t(locale);

  return {
    metadataBase: new URL(SITE.url),
    title: { default: `${dict.brand} — ${dict.tagline}`, template: `%s — ${dict.brand}` },
    description: dict.hero.subtitle,
    applicationName: dict.brand,
    authors: [{ name: dict.brand, url: SITE.url }],
    creator: dict.brand,
    publisher: dict.brand,
    formatDetection: { telephone: true, address: false, email: true },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={HREFLANG[locale]}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="RSS" href="/rss.xml" />
        <meta name="theme-color" content="#9b2226" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {locale === 'ru' ? 'К основному содержанию' : 'Skip to content'}
        </a>
        {children}
      </body>
    </html>
  );
}
