import Link from 'next/link';
import type { PostMeta } from '@/lib/blog';
import { t } from '@/lib/i18n';
import { localePath } from '@/lib/site';

export default function PostCard({ post }: { post: PostMeta }) {
  const dict = t(post.locale);
  const date = new Intl.DateTimeFormat(post.locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(post.date));

  return (
    <Link href={localePath(post.locale, `blog/${post.slug}`)} className="post-card">
      <span className="post-card__category">{post.category}</span>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
      <span className="post-card__meta">
        <time dateTime={post.date}>{date}</time>
        <span aria-hidden="true">·</span>
        <span>
          {post.readingMinutes} {dict.blogSection.minRead}
        </span>
      </span>
    </Link>
  );
}
