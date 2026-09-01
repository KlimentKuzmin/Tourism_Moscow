import Link from 'next/link';
import { DEFAULT_LOCALE, HREFLANG, t } from '@/lib/i18n';
import { localePath } from '@/lib/site';
import '@/styles/globals.css';

/**
 * Корневой 404 сам рендерит <html>/<body>: корневой layout сквозной,
 * а разметку страницы обычно даёт layout локали.
 */
export default function NotFound() {
  const dict = t(DEFAULT_LOCALE);

  return (
    <html lang={HREFLANG[DEFAULT_LOCALE]}>
      <body>
        <main className="section">
          <div className="container center">
            <h1>404 — {dict.notFound.title}</h1>
            <p style={{ color: 'var(--muted)', maxWidth: '52ch', marginInline: 'auto' }}>
              {dict.notFound.text}
            </p>
            <p className="mt-lg">
              <Link className="btn btn--primary" href={localePath(DEFAULT_LOCALE, 'blog')}>
                {dict.notFound.cta}
              </Link>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
