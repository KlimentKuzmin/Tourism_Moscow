export const LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP-47 коды для hreflang и og:locale. */
export const HREFLANG: Record<Locale, string> = { ru: 'ru-RU', en: 'en-US' };

type Dict = {
  brand: string;
  tagline: string;
  nav: { home: string; blog: string; about: string; contacts: string };
  hero: { title: string; subtitle: string; cta: string; secondaryCta: string };
  usp: { title: string; items: { title: string; text: string }[] };
  tours: { title: string; subtitle: string; from: string; duration: string; book: string };
  blogSection: { title: string; subtitle: string; all: string; readMore: string; minRead: string };
  form: {
    title: string;
    subtitle: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    contactPreference: string;
    tour: string;
    tourPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    successHint: string;
    error: string;
    consent: string;
    privacy: string;
    required: string;
    invalidPhone: string;
    invalidName: string;
  };
  faq: { title: string };
  blogIndex: { title: string; subtitle: string; empty: string; readingTime: string };
  article: { published: string; updated: string; author: string; toc: string; related: string; share: string; backToBlog: string };
  footer: { rights: string; madeWith: string; docs: string; nav: string; contacts: string };
  notFound: { title: string; text: string; cta: string };
};

export const T: Record<Locale, Dict> = {
  ru: {
    brand: 'Москва Тревел',
    tagline: 'Авторские экскурсии и туры по Москве',
    nav: { home: 'Главная', blog: 'Блог', about: 'О нас', contacts: 'Контакты' },
    hero: {
      title: 'Экскурсии по Москве, которые не похожи на путеводитель',
      subtitle:
        'Пешеходные маршруты, речные прогулки и индивидуальные программы с гидами, которые живут в городе и знают его изнутри. Подберём маршрут под ваш темп, бюджет и интересы.',
      cta: 'Оставить заявку',
      secondaryCta: 'Читать блог',
    },
    usp: {
      title: 'Почему с нами',
      items: [
        { title: 'Лицензированные гиды', text: 'Аккредитация в Музеях Московского Кремля и профильное историческое образование.' },
        { title: 'Малые группы', text: 'До 8 человек, чтобы слышать гида без наушников и задавать вопросы.' },
        { title: 'Без навязанных магазинов', text: 'Мы не возим в сувенирные лавки за комиссию — только маршрут и город.' },
        { title: 'Ответ за 15 минут', text: 'Заявка приходит менеджеру в Telegram, отвечаем в рабочее время в течение 15 минут.' },
      ],
    },
    tours: {
      title: 'Популярные маршруты',
      subtitle: 'Готовые программы, которые можно адаптировать под вашу компанию',
      from: 'от',
      duration: 'Длительность',
      book: 'Забронировать',
    },
    blogSection: {
      title: 'Гид по Москве в блоге',
      subtitle: 'Разбираем маршруты, цены и расписания — обновляем материалы каждую неделю',
      all: 'Все статьи',
      readMore: 'Читать',
      minRead: 'мин чтения',
    },
    form: {
      title: 'Подобрать экскурсию',
      subtitle: 'Оставьте контакты — вернёмся с 2–3 вариантами маршрута и точной ценой. Без спама и звонков «просто так».',
      name: 'Имя',
      namePlaceholder: 'Как к вам обращаться',
      phone: 'Телефон или Telegram',
      phonePlaceholder: '+7 900 000-00-00 или @username',
      contactPreference: 'Удобный способ связи',
      tour: 'Интересующий маршрут',
      tourPlaceholder: 'Не выбран',
      message: 'Комментарий',
      messagePlaceholder: 'Даты, количество человек, пожелания',
      submit: 'Отправить заявку',
      submitting: 'Отправляем…',
      success: 'Заявка отправлена',
      successHint: 'Менеджер получил её в Telegram и свяжется с вами в течение 15 минут в рабочее время.',
      error: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.',
      consent: 'Нажимая кнопку, вы соглашаетесь с',
      privacy: 'политикой обработки персональных данных',
      required: 'Заполните это поле',
      invalidPhone: 'Укажите телефон в формате +7 900 000-00-00 или ник @username',
      invalidName: 'Имя должно содержать минимум 2 символа',
    },
    faq: { title: 'Частые вопросы' },
    blogIndex: {
      title: 'Блог о Москве',
      subtitle: 'Маршруты, цены, расписания и практические советы. Обновляем регулярно.',
      empty: 'Статьи скоро появятся.',
      readingTime: 'мин чтения',
    },
    article: {
      published: 'Опубликовано',
      updated: 'Обновлено',
      author: 'Автор',
      toc: 'Содержание',
      related: 'Читайте также',
      share: 'Поделиться',
      backToBlog: 'Ко всем статьям',
    },
    footer: {
      rights: 'Все права защищены.',
      madeWith: 'Заявки принимаются круглосуточно, отвечаем с 9:00 до 21:00 по Москве.',
      docs: 'Документы',
      nav: 'Навигация',
      contacts: 'Контакты',
    },
    notFound: {
      title: 'Страница не найдена',
      text: 'Возможно, материал переехал. Загляните в блог — там больше 100 маршрутов по Москве.',
      cta: 'Перейти в блог',
    },
  },
  en: {
    brand: 'Moscow Travel',
    tagline: 'Small-group tours and private guides in Moscow',
    nav: { home: 'Home', blog: 'Blog', about: 'About', contacts: 'Contacts' },
    hero: {
      title: 'Moscow tours that read nothing like a guidebook',
      subtitle:
        'Walking routes, river cruises and private programmes led by guides who actually live here. We adapt the pace, the budget and the theme to you.',
      cta: 'Request a tour',
      secondaryCta: 'Read the blog',
    },
    usp: {
      title: 'Why travel with us',
      items: [
        { title: 'Licensed guides', text: 'Accredited for the Moscow Kremlin Museums, with degrees in history and art history.' },
        { title: 'Groups of up to 8', text: 'Small enough to hear your guide without a headset and to actually ask questions.' },
        { title: 'No forced shopping stops', text: 'We never route you through commission souvenir shops — just the city.' },
        { title: 'Answer in 15 minutes', text: 'Your request lands in our managers Telegram and gets a reply within 15 minutes during business hours.' },
      ],
    },
    tours: {
      title: 'Popular routes',
      subtitle: 'Ready-made programmes you can tailor to your group',
      from: 'from',
      duration: 'Duration',
      book: 'Book now',
    },
    blogSection: {
      title: 'Moscow guide on our blog',
      subtitle: 'Routes, prices and timetables — refreshed every week',
      all: 'All articles',
      readMore: 'Read',
      minRead: 'min read',
    },
    form: {
      title: 'Plan your tour',
      subtitle: 'Leave your contacts and we will come back with 2–3 route options and an exact price. No spam, no cold calls.',
      name: 'Name',
      namePlaceholder: 'How should we address you',
      phone: 'Phone or Telegram',
      phonePlaceholder: '+7 900 000-00-00 or @username',
      contactPreference: 'Preferred channel',
      tour: 'Route of interest',
      tourPlaceholder: 'Not selected',
      message: 'Comment',
      messagePlaceholder: 'Dates, group size, special requests',
      submit: 'Send request',
      submitting: 'Sending…',
      success: 'Request sent',
      successHint: 'It reached our manager in Telegram — expect a reply within 15 minutes during business hours.',
      error: 'We could not send the request. Please try again or message us on Telegram.',
      consent: 'By submitting you agree to our',
      privacy: 'privacy policy',
      required: 'This field is required',
      invalidPhone: 'Use +7 900 000-00-00 or an @username handle',
      invalidName: 'Name must be at least 2 characters',
    },
    faq: { title: 'Frequently asked questions' },
    blogIndex: {
      title: 'Moscow travel blog',
      subtitle: 'Routes, prices, timetables and practical advice. Updated regularly.',
      empty: 'Articles are coming soon.',
      readingTime: 'min read',
    },
    article: {
      published: 'Published',
      updated: 'Updated',
      author: 'Author',
      toc: 'Contents',
      related: 'Read next',
      share: 'Share',
      backToBlog: 'All articles',
    },
    footer: {
      rights: 'All rights reserved.',
      madeWith: 'Requests are accepted 24/7, we reply between 9:00 and 21:00 Moscow time.',
      docs: 'Documents',
      nav: 'Navigation',
      contacts: 'Contacts',
    },
    notFound: {
      title: 'Page not found',
      text: 'This page may have moved. Try the blog — it holds more than 100 Moscow routes.',
      cta: 'Go to the blog',
    },
  },
};

export function t(locale: Locale) {
  return T[locale];
}
