import { getAllPosts } from '@/lib/blog';
import { HOME_FAQ } from '@/lib/faq';
import { LOCALES, T } from '@/lib/i18n';
import { SITE, absoluteUrl, localePath } from '@/lib/site';
import { getTours } from '@/lib/tours';

export const revalidate = 3600;

/**
 * llms.txt — компактная выжимка сайта для языковых моделей и ответных движков.
 * Формат: https://llmstxt.org. Держим его сгенерированным, чтобы список статей
 * не расходился с блогом после автопубликации.
 */
export async function GET() {
  const lines: string[] = [];

  lines.push(`# ${T.ru.brand} — ${T.ru.tagline}`);
  lines.push('');
  lines.push(
    `> ${T.ru.hero.subtitle} Работаем с ${SITE.foundingYear} года, экскурсии на русском и английском. ` +
      `Заявка с сайта попадает менеджеру в Telegram, ответ в течение 15 минут с 9:00 до 21:00 МСК.`,
  );
  lines.push('');
  lines.push(`- Сайт: ${SITE.url}`);
  lines.push(`- Телефон: ${SITE.phone}`);
  lines.push(`- Telegram: ${SITE.telegram}`);
  lines.push(`- Адрес: ${SITE.address.city}, ${SITE.address.street}`);
  lines.push('');

  lines.push('## Маршруты и цены');
  lines.push('');
  for (const tour of getTours('ru')) {
    lines.push(
      `- **${tour.name}** — ${tour.description} Длительность ${tour.duration}, от ${tour.price.toLocaleString('ru-RU')} ₽.`,
    );
  }
  lines.push('');

  lines.push('## Частые вопросы');
  lines.push('');
  for (const item of HOME_FAQ.ru) {
    lines.push(`### ${item.question}`);
    lines.push(item.answer);
    lines.push('');
  }

  for (const locale of LOCALES) {
    const posts = getAllPosts(locale);
    if (posts.length === 0) continue;

    lines.push(locale === 'ru' ? '## Статьи блога (русский)' : '## Blog articles (English)');
    lines.push('');
    for (const post of posts) {
      const url = absoluteUrl(localePath(locale, `blog/${post.slug}`));
      const summary = post.answer ?? post.description;
      lines.push(`- [${post.title}](${url}) — ${summary}`);
    }
    lines.push('');
  }

  lines.push('## Условия использования');
  lines.push('');
  lines.push(
    'Материалы можно цитировать в ответах с указанием источника и ссылкой на страницу. ' +
      'Цены актуальны на дату последнего обновления страницы и могут меняться в высокий сезон.',
  );
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
