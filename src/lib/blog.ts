import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';
import type { Locale } from './i18n';
import { LOCALES } from './i18n';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

export type FaqItem = { question: string; answer: string };

export type PostMeta = {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  /** ISO-дата публикации. Статьи с датой в будущем скрыты до наступления даты. */
  date: string;
  updated?: string;
  author: string;
  category: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  /** Ключевой вопрос, на который отвечает статья — используется в JSON-LD и llms.txt. */
  answer?: string;
  /** id маршрута из lib/tours — статья продаёт конкретный тур, форма его подставляет. */
  tour?: string;
  faq: FaqItem[];
  /** Slug статьи-двойника на другом языке для hreflang. */
  translationKey?: string;
  draft: boolean;
  featured: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & { html: string; headings: Heading[] };
export type Heading = { id: string; text: string; depth: 2 | 3 };

function localeDir(locale: Locale): string {
  return path.join(CONTENT_DIR, locale);
}

function listSlugs(locale: Locale): string[] {
  const dir = localeDir(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim());
  return [];
}

function asFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      const question = typeof record?.question === 'string' ? record.question : '';
      const answer = typeof record?.answer === 'string' ? record.answer : '';
      return { question, answer };
    })
    .filter((item) => item.question && item.answer);
}

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

function readRaw(locale: Locale, slug: string): { meta: PostMeta; body: string } | null {
  const file = path.join(localeDir(locale), `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const date = data.date instanceof Date ? data.date.toISOString() : String(data.date ?? '');
  const updated = data.updated instanceof Date ? data.updated.toISOString() : data.updated ? String(data.updated) : undefined;

  return {
    body: content,
    meta: {
      slug,
      locale,
      title: String(data.title ?? slug),
      description: String(data.description ?? ''),
      date,
      updated,
      author: String(data.author ?? 'Редакция Москва Тревел'),
      category: String(data.category ?? 'Гид по городу'),
      tags: asStringArray(data.tags),
      cover: data.cover ? String(data.cover) : undefined,
      coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
      answer: data.answer ? String(data.answer) : undefined,
      tour: data.tour ? String(data.tour) : undefined,
      faq: asFaq(data.faq),
      translationKey: data.translationKey ? String(data.translationKey) : undefined,
      draft: data.draft === true,
      featured: data.featured === true,
      readingMinutes: estimateReadingMinutes(content),
    },
  };
}

/**
 * Статья видна, если она не черновик и её дата публикации уже наступила.
 * Именно это правило делает отложенный выпуск возможным: файл лежит в репозитории
 * заранее, а на сайте появляется в день, указанный во фронтматтере.
 */
export function isPublished(meta: PostMeta, now = new Date()): boolean {
  if (meta.draft) return false;
  if (!meta.date) return false;
  const published = new Date(meta.date);
  if (Number.isNaN(published.getTime())) return false;
  return published.getTime() <= now.getTime();
}

export function getAllPosts(locale: Locale, options: { includeScheduled?: boolean } = {}): PostMeta[] {
  const now = new Date();
  return listSlugs(locale)
    .map((slug) => readRaw(locale, slug)?.meta)
    .filter((meta): meta is PostMeta => Boolean(meta))
    .filter((meta) => options.includeScheduled || isPublished(meta, now))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllPostsAllLocales(): PostMeta[] {
  return LOCALES.flatMap((locale) => getAllPosts(locale));
}

export function getPostSlugs(locale: Locale): string[] {
  return getAllPosts(locale).map((post) => post.slug);
}

export async function getPost(locale: Locale, slug: string): Promise<Post | null> {
  const raw = readRaw(locale, slug);
  if (!raw || !isPublished(raw.meta)) return null;

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: ['heading-anchor'] },
    })
    .use(rehypeStringify)
    .process(raw.body);

  return { ...raw.meta, html: String(file), headings: extractHeadings(raw.body) };
}

/** Оглавление строится из markdown, чтобы id совпадали с rehype-slug. */
function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inCodeBlock = false;

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const text = match[2].replace(/[*_`]/g, '');
    headings.push({ id: slugify(text), text, depth: match[1].length as 2 | 3 });
  }
  return headings;
}

/** Повторяет поведение github-slugger, который использует rehype-slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

/** Похожие статьи: сначала та же категория, затем совпадение тегов. */
export function getRelatedPosts(post: PostMeta, limit = 3): PostMeta[] {
  const pool = getAllPosts(post.locale).filter((item) => item.slug !== post.slug);
  const scored = pool.map((item) => {
    const sharedTags = item.tags.filter((tag) => post.tags.includes(tag)).length;
    const sameCategory = item.category === post.category ? 2 : 0;
    return { item, score: sharedTags + sameCategory };
  });

  return scored
    .sort((a, b) => b.score - a.score || new Date(b.item.date).getTime() - new Date(a.item.date).getTime())
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function getCategories(locale: Locale): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts(locale)) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** Находит перевод статьи по translationKey — нужен для корректного hreflang. */
export function getTranslation(post: PostMeta, target: Locale): PostMeta | null {
  if (target === post.locale) return post;
  const key = post.translationKey ?? post.slug;
  return (
    getAllPosts(target).find((item) => (item.translationKey ?? item.slug) === key) ?? null
  );
}
