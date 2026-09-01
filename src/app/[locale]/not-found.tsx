import Link from 'next/link';
import { DEFAULT_LOCALE, t } from '@/lib/i18n';
import { localePath } from '@/lib/site';

export default function LocaleNotFound() {
  const dict = t(DEFAULT_LOCALE);

  return (
    <main id="main" className="section">
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
  );
}
