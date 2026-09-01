import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeadForm from '@/components/LeadForm';
import Faq from '@/components/Faq';
import PostCard from '@/components/PostCard';
import JsonLd from '@/components/JsonLd';
import { getAllPosts } from '@/lib/blog';
import { HOME_FAQ } from '@/lib/faq';
import { isLocale, t } from '@/lib/i18n';
import { localePath } from '@/lib/site';
import { getTours } from '@/lib/tours';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  graph,
  organizationJsonLd,
  samePathAlternates,
  tourJsonLd,
  websiteJsonLd,
} from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = t(locale);

  return {
    title: `${dict.hero.title}`,
    description: dict.hero.subtitle,
    alternates: samePathAlternates('', locale),
    keywords:
      locale === 'ru'
        ? ['экскурсии по Москве', 'гид в Москве', 'что посмотреть в Москве', 'туры по Москве', 'Кремль экскурсия']
        : ['Moscow tours', 'Moscow guide', 'things to do in Moscow', 'Kremlin tour', 'Moscow walking tour'],
    openGraph: {
      type: 'website',
      title: dict.hero.title,
      description: dict.hero.subtitle,
      url: localePath(locale),
      siteName: dict.brand,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = t(locale);
  const tours = getTours(locale);
  const posts = getAllPosts(locale).slice(0, 3);
  const faq = HOME_FAQ[locale];

  const jsonLd = graph(
    organizationJsonLd(locale),
    websiteJsonLd(locale),
    breadcrumbJsonLd([{ name: dict.nav.home, path: localePath(locale) }]),
    faqJsonLd(faq),
    ...tours.map((tour) =>
      tourJsonLd(
        {
          name: tour.name,
          description: tour.description,
          price: tour.price,
          duration: tour.duration,
          path: localePath(locale, `#tour-${tour.id}`),
        },
        locale,
      ),
    ),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header locale={locale} switcherPaths={{ ru: '', en: '' }} />

      <main id="main">
        <section className="hero">
          <div className="container hero__grid">
            <div>
              <span className="hero__eyebrow">{dict.tagline}</span>
              <h1>{dict.hero.title}</h1>
              <p className="hero__lead">{dict.hero.subtitle}</p>

              <div className="hero__actions">
                <a className="btn btn--primary" href="#lead">
                  {dict.hero.cta}
                </a>
                <Link className="btn btn--ghost" href={localePath(locale, 'blog')}>
                  {dict.hero.secondaryCta}
                </Link>
              </div>

              <div className="stats">
                <div className="stat">
                  <div className="stat__value">9 лет</div>
                  <div className="stat__label">
                    {locale === 'ru' ? 'работаем в Москве' : 'guiding in Moscow'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat__value">4 800+</div>
                  <div className="stat__label">
                    {locale === 'ru' ? 'проведённых экскурсий' : 'tours delivered'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat__value">4,9 / 5</div>
                  <div className="stat__label">
                    {locale === 'ru' ? 'средняя оценка гостей' : 'average guest rating'}
                  </div>
                </div>
              </div>
            </div>

            <LeadForm locale={locale} source="home" id="lead" />
          </div>
        </section>

        <section className="section" id="tours">
          <div className="container">
            <div className="section__head">
              <h2>{dict.tours.title}</h2>
              <p>{dict.tours.subtitle}</p>
            </div>

            <div className="grid">
              {tours.map((tour) => (
                <article className="card tour-card" key={tour.id} id={`tour-${tour.id}`}>
                  <span className="tour-card__emoji" aria-hidden="true">
                    {tour.emoji}
                  </span>
                  <h3>{tour.name}</h3>
                  <p>{tour.description}</p>
                  <ul className="tags">
                    {tour.highlights.map((highlight) => (
                      <li className="tag" key={highlight}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  <div className="tour-card__meta">
                    <span>
                      {dict.tours.duration}: {tour.duration}
                    </span>
                    <span className="tour-card__price">
                      {dict.tours.from} {tour.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <a className="btn btn--ghost" href="#lead">
                    {dict.tours.book}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--alt">
          <div className="container">
            <div className="section__head">
              <h2>{dict.usp.title}</h2>
            </div>
            <div className="grid">
              {dict.usp.items.map((item) => (
                <div className="card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {posts.length > 0 && (
          <section className="section">
            <div className="container">
              <div className="section__head">
                <h2>{dict.blogSection.title}</h2>
                <p>{dict.blogSection.subtitle}</p>
              </div>
              <div className="post-grid">
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
              <p className="center mt-lg">
                <Link className="btn btn--ghost" href={localePath(locale, 'blog')}>
                  {dict.blogSection.all}
                </Link>
              </p>
            </div>
          </section>
        )}

        <Faq title={dict.faq.title} items={faq} />

        <section className="section section--alt">
          <div className="container" style={{ maxWidth: 720 }}>
            <LeadForm
              locale={locale}
              source="contacts"
              title={locale === 'ru' ? 'Готовы поехать?' : 'Ready to go?'}
            />
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </>
  );
}
