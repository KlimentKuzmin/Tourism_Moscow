import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { LOCALES, t } from '@/lib/i18n';
import { localePath } from '@/lib/site';

type Props = {
  locale: Locale;
  /** Путь внутри локали для переключателя языка, например "blog/kremlin". */
  switcherPaths?: Partial<Record<Locale, string | null>>;
};

export default function Header({ locale, switcherPaths }: Props) {
  const dict = t(locale);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href={localePath(locale)} className="logo">
          <span className="logo__mark" aria-hidden="true">
            М
          </span>
          {dict.brand}
        </Link>

        <nav className="site-nav" aria-label={dict.nav.home}>
          <Link href={localePath(locale)}>{dict.nav.home}</Link>
          <Link href={localePath(locale, 'blog')}>{dict.nav.blog}</Link>
          <Link href={localePath(locale, '#tours')}>{dict.tours.title}</Link>
          <Link href={localePath(locale, '#lead')}>{dict.nav.contacts}</Link>
        </nav>

        <div className="lang-switch">
          {LOCALES.map((item) => {
            const target = switcherPaths?.[item];
            // Если перевода нет, ведём на главную этой локали, а не на 404.
            const href = target === null ? localePath(item) : localePath(item, target ?? '');
            return (
              <Link key={item} href={href} aria-current={item === locale} hrefLang={item}>
                {item}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
