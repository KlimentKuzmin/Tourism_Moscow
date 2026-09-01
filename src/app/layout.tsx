import type { ReactNode } from 'react';
import '@/styles/globals.css';

/**
 * Корневой layout — сквозной: <html> и <body> рендерит src/app/[locale]/layout.tsx,
 * потому что атрибут lang зависит от локали в адресе.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
