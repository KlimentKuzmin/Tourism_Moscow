# Москва Тревел — сайт экскурсий с блогом, заявками в Telegram и автовыпуском статей

Двуязычный (RU/EN) сайт туристической компании на Next.js 15: продающий блог,
оптимизированный под обычные и ответные (AI) поисковики, форма заявки на главной
и **в каждой статье**, доставка заявок в Telegram и автоматический регулярный
выпуск новых страниц блога.

## Что внутри

| Задача | Как решена |
| --- | --- |
| Блог для SEO | SSG-страницы с revalidate, JSON-LD (`BlogPosting`, `FAQPage`, `BreadcrumbList`), sitemap с hreflang, RSS, семантическая вёрстка, оглавление, перелинковка похожих статей |
| Продвижение в AI-поисковиках | `/llms.txt` по стандарту [llmstxt.org](https://llmstxt.org), абзац-ответ в начале каждой статьи, FAQ-блоки в разметке, разрешения для GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot в `robots.txt` |
| Формы заявки | `src/components/LeadForm.tsx` — на главной (2 шт.), в блоге и **дважды в каждой статье**: внутри текста и в конце |
| Заявки в Telegram | `POST /api/lead` → Bot API `sendMessage` с маршрутом, страницей, UTM и московским временем |
| Автовыпуск блога | Очередь тем + генератор статей на Claude + отложенная публикация по дате + ревалидация по cron |

Одна статья = один маршрут: материал продаёт конкретную экскурсию, и форма внутри
статьи автоматически подставляет её в поле «интересующий маршрут».

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # заполнить TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
npm run dev                  # http://localhost:3000
```

Проверки перед деплоем:

```bash
npm run check   # typecheck + lint + build
```

## Настройка Telegram

1. В [@BotFather](https://t.me/BotFather) создать бота → получить `TELEGRAM_BOT_TOKEN`.
2. Добавить бота в рабочий чат и дать право писать сообщения.
3. Написать в чат любое сообщение и открыть
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → взять `chat.id`
   (у групп он начинается с `-100`) → это `TELEGRAM_CHAT_ID`.
4. Для супергруппы с темами можно указать `TELEGRAM_THREAD_ID` — заявки пойдут в отдельную тему.

Если переменные не заданы, `/api/lead` отвечает `503` и пишет заявку в лог платформы,
чтобы обращение не потерялось молча.

Заявка в чате выглядит так:

```
🧭 Заявка из статьи

Имя: Иван Петров
Контакт: @ivan_petrov
Способ связи: Telegram
Маршрут: Кремль и Красная площадь
Комментарий: Двое взрослых, 12 сентября, утренний сеанс

Страница: https://…/ru/blog/kreml-i-krasnaya-ploshchad
Язык: ru
UTM: utm_source=yandex utm_campaign=kremlin
Время (МСК): 01.09.2026, 11:24
```

### Защита от спама

Без капчи, тремя слоями: honeypot-поле (скрыто от людей), отсечка отправок быстрее
двух секунд и ограничение 5 заявок с одного IP за 10 минут. Боту всегда отвечаем
`200`, чтобы он не подбирал обход. Ограничитель хранится в памяти процесса — при
масштабировании на несколько инстансов замените `src/lib/rate-limit.ts` на Vercel KV
или Upstash Redis.

## Автоматизация блога

Механизм состоит из двух независимых частей.

### 1. Отложенная публикация

Статья хранится в репозитории с датой публикации в будущем во фронтматтере.
Пока дата не наступила, `isPublished()` в `src/lib/blog.ts` скрывает её везде:
из списка блога, прямого URL (404), sitemap, RSS и llms.txt.

Когда дата наступает, материал должен появиться без пересборки — за это отвечает
`GET /api/cron/publish`: он сбрасывает кеш блога. Эндпоинт защищён `CRON_SECRET`
и вызывается ежедневно из двух мест (достаточно любого):

- **Vercel Cron** — `vercel.json`, ежедневно в 03:00 UTC;
- **GitHub Actions** — `.github/workflows/blog-revalidate.yml` (нужны переменная
  `SITE_URL` и секрет `CRON_SECRET` в настройках репозитория).

Посмотреть расписание локально:

```bash
node scripts/publish-scheduled.mjs --check
```

### 2. Генерация новых статей

`content/queue/topics.json` — очередь маршрутов: заголовок, ракурс, ключевые слова
и id тура на обоих языках. Раз в неделю
`.github/workflows/blog-autopublish.yml` берёт следующую тему со `status: pending`,
пишет по ней статью на русском и английском, ставит дату публикации на неделю вперёд,
проверяет сборку и коммитит результат.

```bash
node scripts/generate-article.mjs --dry-run          # посмотреть, что получится
node scripts/generate-article.mjs --id=vdnkh-retro   # конкретная тема
node scripts/generate-article.mjs --offset-days=14   # опубликовать через 2 недели
```

Текст пишет Claude (`claude-opus-5`), если в секретах репозитория задан
`ANTHROPIC_API_KEY`. Промпт в `scripts/generate-article.mjs` держит редакционный
стиль: один маршрут на статью, впечатления вместо перечня фактов, без рекламных
штампов. Цены и длительность подтягиваются из `src/lib/tours.ts`, чтобы не
расходиться с сайтом. Без ключа скрипт создаёт статью со структурой и полным
фронтматтером — текст дописывает редактор.

Чтобы добавить маршрут в очередь, допишите объект в `topics` со `status: "pending"`.

## Структура

```
content/
  blog/{ru,en}/*.md      статьи; дата во фронтматтере = дата публикации
  queue/topics.json      очередь маршрутов для автовыпуска
scripts/
  generate-article.mjs   генерация статьи из очереди
  publish-scheduled.mjs  проверка расписания + ревалидация боевого сайта
src/
  app/[locale]/          главная, блог, статья, политика (RU/EN)
  app/api/lead/          приём заявок → Telegram
  app/api/cron/publish/  ревалидация блога по расписанию
  app/{sitemap,robots}.ts, app/rss.xml/, app/llms.txt/
  components/            LeadForm, Header, Footer, PostCard, Faq, JsonLd
  lib/                   blog, seo, telegram, i18n, tours, faq, rate-limit
```

## Деплой на Vercel

1. Импортировать репозиторий в Vercel.
2. Задать переменные окружения из `.env.example`
   (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`).
3. Cron из `vercel.json` подключится автоматически.

`NEXT_PUBLIC_SITE_URL` должен содержать боевой домен без слэша на конце — от него
считаются canonical, hreflang, sitemap и JSON-LD.

## Фронтматтер статьи

```yaml
---
title: "Заголовок H1 и <title>"
description: "Мета-описание, 150–165 символов"
date: 2026-06-09          # дата публикации; будущая = статья скрыта
updated: 2026-08-25       # необязательно, идёт в dateModified
author: "Имя автора"
category: "Маршруты"
tags: ["тег1", "тег2"]
tour: kremlin             # id из src/lib/tours.ts — подставится в форму
translationKey: kremlin-red-square   # связывает RU- и EN-версии для hreflang
featured: true
answer: "Абзац-ответ для AI-поисковиков и JSON-LD"
faq:
  - question: "Вопрос"
    answer: "Ответ"
draft: false
---
```

Форма заявки вставляется в текст автоматически перед третьим заголовком `##`
(если разделов меньше четырёх — только в конце статьи).
