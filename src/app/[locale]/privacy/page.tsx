import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LOCALES, isLocale, t } from '@/lib/i18n';
import { SITE } from '@/lib/site';
import { samePathAlternates } from '@/lib/seo';

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

  return {
    title: locale === 'ru' ? 'Политика обработки персональных данных' : 'Privacy policy',
    alternates: samePathAlternates('privacy', locale),
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = t(locale);

  return (
    <>
      <Header locale={locale} switcherPaths={{ ru: 'privacy', en: 'privacy' }} />
      <main id="main" className="section">
        <div className="container prose">
          {locale === 'ru' ? (
            <>
              <h1>Политика обработки персональных данных</h1>
              <p>
                Оставляя заявку на сайте {dict.brand}, вы передаёте имя и контакт (телефон или ник в
                Telegram). Мы используем их только для того, чтобы ответить на заявку и подобрать
                экскурсию.
              </p>
              <h2>Что мы собираем</h2>
              <ul>
                <li>имя, указанное в форме;</li>
                <li>телефон или ник в Telegram;</li>
                <li>комментарий, выбранный маршрут и адрес страницы, с которой отправлена заявка;</li>
                <li>UTM-метки, если вы пришли по рекламной ссылке.</li>
              </ul>
              <h2>Куда попадают данные</h2>
              <p>
                Заявка отправляется в рабочий чат компании в Telegram. Мы не передаём данные третьим
                лицам, не продаём их и не используем для рассылок без отдельного согласия.
              </p>
              <h2>Сколько храним</h2>
              <p>
                Переписку по заявке храним 12 месяцев, после чего удаляем. Вы можете попросить удалить
                данные раньше — напишите на <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
              </p>
              <h2>Куки</h2>
              <p>
                Сайт использует технические куки для выбора языка. Аналитические сервисы подключаются
                только при вашем согласии.
              </p>
            </>
          ) : (
            <>
              <h1>Privacy policy</h1>
              <p>
                When you submit a request on {dict.brand}, you share your name and a contact (phone
                number or Telegram handle). We use them solely to answer your request and put a tour
                together.
              </p>
              <h2>What we collect</h2>
              <ul>
                <li>the name you enter in the form;</li>
                <li>your phone number or Telegram handle;</li>
                <li>your comment, the selected route and the page the request came from;</li>
                <li>UTM parameters if you arrived from an ad.</li>
              </ul>
              <h2>Where the data goes</h2>
              <p>
                Requests are delivered to our internal Telegram chat. We never sell your data, pass it
                to third parties, or add you to mailing lists without separate consent.
              </p>
              <h2>How long we keep it</h2>
              <p>
                Correspondence is kept for 12 months and then deleted. You can ask us to delete it
                sooner — write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
              </p>
              <h2>Cookies</h2>
              <p>
                The site uses a technical cookie to remember your language. Analytics load only with
                your consent.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
