import type { Locale } from './i18n';

export const HOME_FAQ: Record<Locale, { question: string; answer: string }[]> = {
  ru: [
    {
      question: 'Сколько стоит экскурсия по Москве с гидом?',
      answer:
        'Групповая пешеходная экскурсия стоит от 2 800 ₽ с человека, индивидуальная — от 9 000 ₽ за группу до 6 человек. Входные билеты в Кремль и музеи оплачиваются отдельно: Оружейная палата — 1 500 ₽, Соборная площадь — 1 200 ₽.',
    },
    {
      question: 'Нужно ли покупать билеты в Кремль заранее?',
      answer:
        'Да. Билеты в Оружейную палату продаются на конкретный сеанс и разбираются за 5–7 дней до даты в высокий сезон. Мы бронируем их вместе с экскурсией, если вы предупредите за неделю.',
    },
    {
      question: 'В какое время года лучше приезжать в Москву?',
      answer:
        'Май–июнь и сентябрь — самая комфортная погода (+18…+24 °C) и длинный световой день. Декабрь хорош для ярмарок и подсветки, но световой день короткий, а на улице −5…−12 °C.',
    },
    {
      question: 'Экскурсии проводятся на английском языке?',
      answer:
        'Да, все маршруты доступны на русском и английском. Немецкий, французский, испанский и китайский — по предварительному запросу минимум за 5 дней.',
    },
    {
      question: 'Что делать, если в день экскурсии идёт дождь?',
      answer:
        'Мы заменяем пешеходную часть на маршрут по метро или музейную программу без доплаты либо переносим экскурсию на любую другую дату. Отмена за 24 часа — возврат 100%.',
    },
  ],
  en: [
    {
      question: 'How much does a guided tour of Moscow cost?',
      answer:
        'A small-group walking tour starts at 2,800 ₽ per person; a private tour starts at 9,000 ₽ for a group of up to six. Museum and Kremlin tickets are paid separately: the Armoury Chamber is 1,500 ₽ and Cathedral Square is 1,200 ₽.',
    },
    {
      question: 'Do I need to buy Kremlin tickets in advance?',
      answer:
        'Yes. Armoury Chamber tickets are sold for a fixed entry slot and sell out 5–7 days ahead in high season. We book them together with your tour if you give us a week of notice.',
    },
    {
      question: 'When is the best time of year to visit Moscow?',
      answer:
        'May–June and September bring the most comfortable weather (18–24 °C) and long daylight. December is excellent for markets and lights, but daylight is short and temperatures sit between −5 and −12 °C.',
    },
    {
      question: 'Are the tours available in English?',
      answer:
        'Yes, every route runs in both Russian and English. German, French, Spanish and Chinese are available on request with at least five days of notice.',
    },
    {
      question: 'What happens if it rains on the day of the tour?',
      answer:
        'We swap the walking section for a metro route or a museum programme at no extra cost, or move the tour to any other date. Cancel 24 hours ahead and you get a full refund.',
    },
  ],
};
