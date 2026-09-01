import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeadForm from '@/components/LeadForm';
import PostCard from '@/components/PostCard';
import JsonLd from '@/components/JsonLd';
import { getAllPosts, getPost, getRelatedPosts, getTranslation } from '@/lib/blog';
import { getTours } from '@/lib/tours';
import { HREFLANG, LOCALES, isLocale, t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { absoluteUrl, localePath } from '@/lib/site';
import { articleJsonLd, breadcrumbJsonLd, buildAlternates, faqJsonLd, graph } from '@/lib/seo';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllPosts(locale).map((post) => ({ locale, slug: post.slug })),
  );
}

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const post = await getPost(locale, slug);
  if (!post) return { title: t(locale).notFound.title, robots: { index: false, follow: true } };

  const translation = getTranslation(post, otherLocale(locale));

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: buildAlternates(
      {
        ru: locale === 'ru' ? `blog/${post.slug}` : translation ? `blog/${translation.slug}` : null,
        en: locale === 'en' ? `blog/${post.slug}` : translation ? `blog/${translation.slug}` : null,
      },
      locale,
    ),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: localePath(locale, `blog/${post.slug}`),
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags,
      locale: HREFLANG[locale].replace('-', '_'),
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const post = await getPost(locale, slug);
  if (!post) notFound();

  const dict = t(locale);
  const related = getRelatedPosts(post);
  const translation = getTranslation(post, otherLocale(locale));
  const url = absoluteUrl(localePath(locale, `blog/${post.slug}`));
  const [beforeForm, afterForm] = splitForInlineForm(post.html);
  // Статья продаёт конкретный маршрут — подставляем его в форму, а не заголовок.
  const linkedTour = getTours(locale).find((item) => item.id === post.tour);
  const defaultTour = linkedTour?.name ?? post.title;

  const jsonLd = graph(
    articleJsonLd(post, url),
    breadcrumbJsonLd([
      { name: dict.nav.home, path: localePath(locale) },
      { name: dict.nav.blog, path: localePath(locale, 'blog') },
      { name: post.title, path: localePath(locale, `blog/${post.slug}`) },
    ]),
    ...(post.faq.length > 0 ? [faqJsonLd(post.faq)] : []),
  );

  const formatted = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header
        locale={locale}
        switcherPaths={{
          ru: locale === 'ru' ? `blog/${post.slug}` : translation ? `blog/${translation.slug}` : null,
          en: locale === 'en' ? `blog/${post.slug}` : translation ? `blog/${translation.slug}` : null,
        }}
      />

      <main id="main" className="article">
        <div className="container article__layout">
          <article>
            <nav className="breadcrumbs" aria-label="breadcrumbs">
              <Link href={localePath(locale)}>{dict.nav.home}</Link> ›{' '}
              <Link href={localePath(locale, 'blog')}>{dict.nav.blog}</Link> › {post.category}
            </nav>

            <h1>{post.title}</h1>
            <p className="article__lead">{post.description}</p>

            <div className="article__meta">
              <span>
                {dict.article.published}:{' '}
                <time dateTime={post.date}>{formatted.format(new Date(post.date))}</time>
              </span>
              {post.updated && (
                <span>
                  {dict.article.updated}:{' '}
                  <time dateTime={post.updated}>{formatted.format(new Date(post.updated))}</time>
                </span>
              )}
              <span>
                {dict.article.author}: {post.author}
              </span>
              <span>
                {post.readingMinutes} {dict.blogIndex.readingTime}
              </span>
            </div>

            {/* Ответ одним абзацем в начале — то, что ответные движки цитируют охотнее всего. */}
            {post.answer && (
              <blockquote className="prose" data-answer>
                {post.answer}
              </blockquote>
            )}

            <div className="prose" dangerouslySetInnerHTML={{ __html: beforeForm }} />

            {/* Форма заявки в каждой статье — в теле материала и ещё раз в конце. */}
            <LeadForm
              locale={locale}
              source="article"
              variant="inline"
              defaultTour={defaultTour}
              title={
                locale === 'ru'
                  ? 'Пройти этот маршрут с гидом'
                  : 'Walk this route with a guide'
              }
              subtitle={
                locale === 'ru'
                  ? 'Соберём программу по мотивам этой статьи под ваши даты и темп. Ответим в течение 15 минут.'
                  : 'We will turn this article into a programme that fits your dates and pace. Reply within 15 minutes.'
              }
            />

            {afterForm && (
              <div className="prose" dangerouslySetInnerHTML={{ __html: afterForm }} />
            )}

            {post.faq.length > 0 && (
              <section className="mt-lg">
                <h2>{dict.faq.title}</h2>
                <div className="faq-list">
                  {post.faq.map((item) => (
                    <details className="faq-item" key={item.question}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-lg">
              <LeadForm
                locale={locale}
                source="article"
                defaultTour={defaultTour}
                title={
                  linkedTour
                    ? locale === 'ru'
                      ? `«${linkedTour.name}» — ${linkedTour.duration}, от ${linkedTour.price.toLocaleString('ru-RU')} ₽`
                      : `${linkedTour.name} — ${linkedTour.duration}, from ${linkedTour.price.toLocaleString('en-US')} ₽`
                    : undefined
                }
              />
            </div>

            {related.length > 0 && (
              <section className="mt-lg">
                <h2>{dict.article.related}</h2>
                <div className="post-grid">
                  {related.map((item) => (
                    <PostCard key={item.slug} post={item} />
                  ))}
                </div>
              </section>
            )}

            <p className="mt-lg">
              <Link href={localePath(locale, 'blog')}>← {dict.article.backToBlog}</Link>
            </p>
          </article>

          <aside className="article__aside">
            {post.headings.length > 1 && (
              <>
                <h2>{dict.article.toc}</h2>
                <ul className="toc">
                  {post.headings.map((heading) => (
                    <li key={heading.id} data-depth={heading.depth}>
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {post.tags.length > 0 && (
              <ul className="tags" style={{ marginTop: 24 }}>
                {post.tags.map((tag) => (
                  <li className="tag" key={tag}>
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}

function otherLocale(locale: Locale): Locale {
  return locale === 'ru' ? 'en' : 'ru';
}

/**
 * Делит статью перед третьим заголовком второго уровня, чтобы форма заявки
 * стояла внутри текста, а не только в конце. Короткие материалы не режем.
 */
function splitForInlineForm(html: string): [string, string] {
  const positions: number[] = [];
  const pattern = /<h2\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) positions.push(match.index);

  if (positions.length < 4) return [html, ''];
  const cut = positions[2];
  return [html.slice(0, cut), html.slice(cut)];
}
