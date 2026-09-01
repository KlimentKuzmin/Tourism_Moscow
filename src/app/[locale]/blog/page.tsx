import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import LeadForm from '@/components/LeadForm';
import JsonLd from '@/components/JsonLd';
import { getAllPosts, getCategories } from '@/lib/blog';
import { HREFLANG, LOCALES, isLocale, t } from '@/lib/i18n';
import { absoluteUrl, localePath } from '@/lib/site';
import { breadcrumbJsonLd, graph, samePathAlternates } from '@/lib/seo';

export const revalidate = 3600;

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
  const dict = t(locale).blogIndex;

  return {
    title: dict.title,
    description: dict.subtitle,
    alternates: { ...samePathAlternates('blog', locale), types: { 'application/rss+xml': '/rss.xml' } },
    openGraph: {
      type: 'website',
      title: dict.title,
      description: dict.subtitle,
      url: localePath(locale, 'blog'),
    },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = t(locale);
  const posts = getAllPosts(locale);
  const categories = getCategories(locale);

  const jsonLd = graph(
    {
      '@type': 'Blog',
      '@id': `${absoluteUrl(localePath(locale, 'blog'))}#blog`,
      name: dict.blogIndex.title,
      description: dict.blogIndex.subtitle,
      inLanguage: HREFLANG[locale],
      url: absoluteUrl(localePath(locale, 'blog')),
      blogPost: posts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.updated ?? post.date,
        url: absoluteUrl(localePath(locale, `blog/${post.slug}`)),
        author: { '@type': 'Person', name: post.author },
      })),
    },
    breadcrumbJsonLd([
      { name: dict.nav.home, path: localePath(locale) },
      { name: dict.nav.blog, path: localePath(locale, 'blog') },
    ]),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header locale={locale} switcherPaths={{ ru: 'blog', en: 'blog' }} />

      <main id="main" className="section">
        <div className="container">
          <div className="section__head">
            <h1>{dict.blogIndex.title}</h1>
            <p>{dict.blogIndex.subtitle}</p>
          </div>

          {categories.length > 0 && (
            <ul className="tags" style={{ marginBottom: 28 }}>
              {categories.map((category) => (
                <li className="tag" key={category.name}>
                  {category.name} · {category.count}
                </li>
              ))}
            </ul>
          )}

          {posts.length === 0 ? (
            <p>{dict.blogIndex.empty}</p>
          ) : (
            <div className="post-grid">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          <div className="mt-lg" style={{ maxWidth: 720, marginInline: 'auto' }}>
            <LeadForm locale={locale} source="contacts" />
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
