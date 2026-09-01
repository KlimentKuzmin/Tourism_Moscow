import type { Locale } from './i18n';

const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';

/** Канонический origin без слэша на конце. */
export const SITE_URL = RAW_URL.replace(/\/+$/, '');

export const SITE = {
  url: SITE_URL,
  telegram: 'https://t.me/moscow_travel_demo',
  phone: '+7 495 000-00-00',
  phoneHref: 'tel:+74950000000',
  email: 'hello@tourism-moscow.example',
  address: {
    street: 'ул. Никольская, 10',
    city: 'Москва',
    postalCode: '109012',
    country: 'RU',
    geo: { lat: 55.7558, lng: 37.6205 },
  },
  social: ['https://t.me/moscow_travel_demo', 'https://vk.com/moscow_travel_demo'],
  foundingYear: 2016,
} as const;

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}
