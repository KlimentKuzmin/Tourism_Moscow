import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { SITE, localePath } from '@/lib/site';

export default function Footer({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <h2>{dict.brand}</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{dict.footer.madeWith}</p>
          </div>

          <div>
            <h2>{dict.footer.nav}</h2>
            <ul>
              <li>
                <Link href={localePath(locale)}>{dict.nav.home}</Link>
              </li>
              <li>
                <Link href={localePath(locale, 'blog')}>{dict.nav.blog}</Link>
              </li>
              <li>
                <Link href={localePath(locale, '#tours')}>{dict.tours.title}</Link>
              </li>
              <li>
                <a href="/rss.xml">RSS</a>
              </li>
            </ul>
          </div>

          <div>
            <h2>{dict.footer.contacts}</h2>
            <ul>
              <li>
                <a href={SITE.phoneHref}>{SITE.phone}</a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>
                <a href={SITE.telegram} rel="noopener">
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2>{dict.footer.docs}</h2>
            <ul>
              <li>
                <Link href={localePath(locale, 'privacy')}>{dict.form.privacy}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>
            © {SITE.foundingYear}–{new Date().getFullYear()} {dict.brand}. {dict.footer.rights}
          </span>
          <span>{SITE.address.city}, {SITE.address.street}</span>
        </div>
      </div>
    </footer>
  );
}
