import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/lib/i18n';

/** Запасной вариант, если middleware не отработал (например, при статическом экспорте). */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
