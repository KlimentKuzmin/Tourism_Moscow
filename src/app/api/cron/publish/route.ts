import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllPosts, isPublished } from '@/lib/blog';
import { LOCALES } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Отложенный выпуск статей.
 *
 * Статья с датой в будущем лежит в репозитории, но скрыта фильтром isPublished().
 * Этот обработчик вызывается по расписанию (Vercel Cron или GitHub Actions) и
 * сбрасывает кеш блога, чтобы материалы, у которых наступила дата, появились
 * на сайте без пересборки и деплоя.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get('authorization');
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();
  const published: string[] = [];
  const scheduled: { slug: string; date: string; locale: string }[] = [];

  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}`);

    for (const post of getAllPosts(locale, { includeScheduled: true })) {
      const path = `/${locale}/blog/${post.slug}`;
      if (isPublished(post, now)) {
        revalidatePath(path);
        published.push(path);
      } else if (!post.draft) {
        scheduled.push({ slug: post.slug, date: post.date, locale });
      }
    }
  }

  revalidatePath('/rss.xml');
  revalidatePath('/sitemap.xml');
  revalidatePath('/llms.txt');

  return NextResponse.json({
    ok: true,
    revalidatedAt: now.toISOString(),
    publishedCount: published.length,
    upcoming: scheduled.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10),
  });
}
