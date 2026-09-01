import type { Locale } from './i18n';

export type Tour = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  highlights: string[];
  emoji: string;
};

export const TOURS: Record<Locale, Tour[]> = {
  ru: [
    {
      id: 'kremlin',
      name: 'Кремль и Красная площадь',
      description:
        'Соборная площадь, Оружейная палата и смотровые точки, с которых Кремль выглядит не открыткой, а живой крепостью.',
      price: 4500,
      duration: '3 часа',
      highlights: ['Соборная площадь', 'Оружейная палата', 'Александровский сад'],
      emoji: '🏛',
    },
    {
      id: 'metro',
      name: 'Метро как музей',
      description:
        'Девять станций Кольцевой и Замоскворецкой линий: мозаики Дейнеки, витражи Корина и истории строителей.',
      price: 3200,
      duration: '2 часа',
      highlights: ['Маяковская', 'Новослободская', 'Комсомольская'],
      emoji: '🚇',
    },
    {
      id: 'river',
      name: 'Москва-река на закате',
      description:
        'Прогулка на теплоходе от Парка Горького до Сити: набережные, Дом на набережной и подсветка «Москва-Сити».',
      price: 2800,
      duration: '2,5 часа',
      highlights: ['Парк Горького', 'Кремлёвская набережная', 'Москва-Сити'],
      emoji: '🛥',
    },
    {
      id: 'modern',
      name: 'Другая Москва: Хамовники и Красный Октябрь',
      description:
        'Конструктивизм, бывшие фабрики и современные арт-пространства — маршрут для тех, кто уже видел центр.',
      price: 3900,
      duration: '3 часа',
      highlights: ['Красный Октябрь', 'Хамовники', 'ГЭС-2'],
      emoji: '🎨',
    },
  ],
  en: [
    {
      id: 'kremlin',
      name: 'The Kremlin and Red Square',
      description:
        'Cathedral Square, the Armoury Chamber and the vantage points where the Kremlin stops being a postcard and turns back into a fortress.',
      price: 4500,
      duration: '3 hours',
      highlights: ['Cathedral Square', 'Armoury Chamber', 'Alexander Garden'],
      emoji: '🏛',
    },
    {
      id: 'metro',
      name: 'The metro as a museum',
      description:
        'Nine stations on the Circle and Zamoskvoretskaya lines: Deineka mosaics, Korin stained glass and the stories of the people who dug them.',
      price: 3200,
      duration: '2 hours',
      highlights: ['Mayakovskaya', 'Novoslobodskaya', 'Komsomolskaya'],
      emoji: '🚇',
    },
    {
      id: 'river',
      name: 'Moskva River at sunset',
      description:
        'A boat ride from Gorky Park to Moscow City: embankments, the House on the Embankment and the skyline lighting up.',
      price: 2800,
      duration: '2.5 hours',
      highlights: ['Gorky Park', 'Kremlin Embankment', 'Moscow City'],
      emoji: '🛥',
    },
    {
      id: 'modern',
      name: 'Another Moscow: Khamovniki and Red October',
      description:
        'Constructivism, former factories and contemporary art spaces — the route for travellers who have already done the centre.',
      price: 3900,
      duration: '3 hours',
      highlights: ['Red October', 'Khamovniki', 'GES-2'],
      emoji: '🎨',
    },
  ],
};

export function getTours(locale: Locale): Tour[] {
  return TOURS[locale];
}
