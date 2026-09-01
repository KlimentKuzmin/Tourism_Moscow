#!/usr/bin/env node
/**
 * Генератор статьи блога из очереди маршрутов.
 *
 * Берёт первую тему со status=pending в content/queue/topics.json, пишет по ней
 * статью на каждый язык из defaults.locales, кладёт файлы в content/blog/<locale>/
 * с датой публикации в будущем и помечает тему как published.
 *
 * Текст пишет Claude, если задан ANTHROPIC_API_KEY. Без ключа скрипт формирует
 * структурную заготовку с полным фронтматтером — её остаётся вычитать руками.
 *
 * Запуск:
 *   node scripts/generate-article.mjs              # следующая тема из очереди
 *   node scripts/generate-article.mjs --id=vdnkh-retro
 *   node scripts/generate-article.mjs --offset-days=14
 *   node scripts/generate-article.mjs --dry-run
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const QUEUE_PATH = path.join(ROOT, 'content', 'queue', 'topics.json');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const MODEL = 'claude-opus-5';

const args = parseArgs(process.argv.slice(2));

/* ------------------------------- утилиты --------------------------------- */

function parseArgs(argv) {
  const result = { dryRun: false, id: null, offsetDays: null };
  for (const arg of argv) {
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg.startsWith('--id=')) result.id = arg.slice(5);
    else if (arg.startsWith('--offset-days=')) result.offsetDays = Number(arg.slice(14));
  }
  return result;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`ошибка: ${message}\n`);
  process.exit(1);
}

/** Экранирует значение для YAML-строки в двойных кавычках. */
function yamlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

/* ------------------------------ генерация -------------------------------- */

const STYLE_GUIDE = `Ты пишешь для сайта авторских экскурсий по Москве. Правила редакции:

1. Одна статья — один маршрут. Не сборник советов и не список достопримечательностей.
2. Пиши про впечатления, а не про факты: что человек видит, слышит и чувствует в каждой точке.
   Факты (даты, цены, размеры) вплетай в живой текст, а не выноси списком.
3. Первый абзац — сцена, а не вступление. Начинай с конкретного момента маршрута.
4. Тон уверенный и человеческий, без рекламных штампов: никаких «незабываемые впечатления»,
   «жемчужина столицы», «поистине уникальный». Никаких восклицательных знаков.
5. 5–6 разделов уровня ## по ходу маршрута, в конце — раздел про формат экскурсии
   и строка с длительностью, ценой и точкой старта жирным.
6. Объём 700–1000 слов. Markdown без заголовка H1 (он берётся из фронтматтера).
7. Одна-две конкретные детали, которых нет в путеводителях: цифра, история, привычка местных.`;

function buildPrompt(topic, locale, tourInfo) {
  const isRu = locale === 'ru';
  return `${isRu ? STYLE_GUIDE : `${STYLE_GUIDE}\n\nВНИМАНИЕ: статья пишется на английском языке для иностранных туристов. Все те же правила, но текст на естественном английском, а не переводом с русского.`}

Маршрут: ${topic.title[locale]}
Ракурс: ${topic.angle[locale]}
Ключевые слова для SEO: ${topic.keywords[locale].join(', ')}
${tourInfo ? `Экскурсия, которую продаёт статья: ${tourInfo.name}, ${tourInfo.duration}, от ${tourInfo.price} ₽ с человека.` : ''}

Верни строго JSON без markdown-обёртки, со схемой:
{
  "description": "мета-описание 150-165 символов, продающее, без кавычек",
  "answer": "один абзац 2-3 предложения: что это за маршрут, сколько длится, сколько стоит. Этот абзац цитируют ответные поисковики, поэтому он должен быть самодостаточным",
  "tags": ["5 тегов"],
  "faq": [{"question": "...", "answer": "..."}],
  "body": "текст статьи в markdown"
}
В faq — 4 вопроса, которые люди реально задают перед такой экскурсией, с развёрнутыми ответами (2-4 предложения, с цифрами).`;
}

async function generateWithClaude(topic, locale, tourInfo) {
  let Anthropic;
  try {
    ({ default: Anthropic } = await import('@anthropic-ai/sdk'));
  } catch {
    log('  @anthropic-ai/sdk не установлен — использую заготовку');
    return null;
  }

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: 'Ты — редактор travel-блога. Отвечай только валидным JSON, без пояснений и без markdown-ограждений.',
    messages: [{ role: 'user', content: buildPrompt(topic, locale, tourInfo) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    throw new Error(`модель отказалась отвечать: ${message.stop_details?.explanation ?? 'без объяснения'}`);
  }

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  return parseJsonResponse(text);
}

/** Модель иногда оборачивает JSON в ```json — снимаем ограждение перед разбором. */
function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`не удалось разобрать ответ модели как JSON: ${error.message}`);
  }
}

/** Заготовка на случай, когда ключа нет: структура верная, текст дописывает редактор. */
function buildFallback(topic, locale, tourInfo) {
  const isRu = locale === 'ru';
  const title = topic.title[locale];
  const angle = topic.angle[locale];

  const sections = isRu
    ? ['Точка старта', 'Главное впечатление', 'Что по дороге', 'Финал маршрута', 'Как проходит экскурсия']
    : ['Where it starts', 'The main impression', 'Along the way', 'How it ends', 'How the tour runs'];

  const body = sections
    .map((heading) => `## ${heading}\n\n${isRu ? 'TODO: дописать раздел.' : 'TODO: write this section.'}\n`)
    .join('\n');

  return {
    description: angle.slice(0, 160),
    answer: angle,
    tags: topic.keywords[locale].slice(0, 5),
    faq: [
      {
        question: isRu ? `Сколько длится маршрут «${title}»?` : `How long is the ${title} route?`,
        answer: tourInfo
          ? `${tourInfo.duration}, ${isRu ? 'от' : 'from'} ${tourInfo.price} ₽.`
          : 'TODO',
      },
    ],
    body: `${angle}\n\n${body}`,
  };
}

/* ------------------------------- сборка ---------------------------------- */

function renderMarkdown({ topic, locale, generated, publishDate, tourInfo, author, category }) {
  const faq = generated.faq
    .map(
      (item) =>
        `  - question: ${yamlString(item.question)}\n    answer: ${yamlString(item.answer)}`,
    )
    .join('\n');

  const frontmatter = [
    '---',
    `title: ${yamlString(topic.title[locale])}`,
    `description: ${yamlString(generated.description)}`,
    `date: ${toIsoDate(publishDate)}`,
    `author: ${yamlString(author)}`,
    `category: ${yamlString(category)}`,
    `tags: [${generated.tags.map((tag) => yamlString(tag)).join(', ')}]`,
    ...(topic.tour ? [`tour: ${topic.tour}`] : []),
    `translationKey: ${topic.id}`,
    `answer: ${yamlString(generated.answer)}`,
    'faq:',
    faq,
    '---',
    '',
  ].join('\n');

  return `${frontmatter}${generated.body.trim()}\n`;
}

/** Цены и длительность живут в src/lib/tours.ts — читаем их оттуда, чтобы не расходились. */
async function readTourInfo(tourId, locale) {
  if (!tourId) return null;

  const source = await fs.readFile(path.join(ROOT, 'src', 'lib', 'tours.ts'), 'utf8');
  const localeStart = source.indexOf(`\n  ${locale}: [`);
  if (localeStart === -1) return null;

  // Блок локали заканчивается там, где начинается следующая (или закрывается объект).
  const rest = source.slice(localeStart + 1);
  const nextLocale = rest.slice(1).search(/\n  [a-z]{2}: \[/);
  const localeBlock = nextLocale === -1 ? rest : rest.slice(0, nextLocale + 1);

  const idAt = localeBlock.indexOf(`id: '${tourId}'`);
  if (idAt === -1) return null;
  const entry = localeBlock.slice(idAt, idAt + 1200);

  const name = /name:\s*'([^']+)'/.exec(entry)?.[1];
  const price = /price:\s*(\d+)/.exec(entry)?.[1];
  const duration = /duration:\s*'([^']+)'/.exec(entry)?.[1];
  if (!name || !price || !duration) return null;

  return { name, price: Number(price), duration };
}

async function main() {
  const queue = JSON.parse(await fs.readFile(QUEUE_PATH, 'utf8'));
  const { defaults } = queue;

  const topic = args.id
    ? queue.topics.find((item) => item.id === args.id)
    : queue.topics.find((item) => item.status === 'pending');

  if (!topic) {
    log('в очереди нет тем со статусом pending — публиковать нечего');
    return;
  }

  const offsetDays = args.offsetDays ?? defaults.publishIntervalDays ?? 7;
  const publishDate = new Date();
  publishDate.setUTCDate(publishDate.getUTCDate() + offsetDays);

  log(`тема: ${topic.id}`);
  log(`дата публикации: ${toIsoDate(publishDate)} (через ${offsetDays} дн.)`);

  const written = [];

  for (const locale of defaults.locales) {
    const slug = topic.slug?.[locale];
    if (!slug) fail(`у темы ${topic.id} нет slug для локали ${locale}`);

    const tourInfo = await readTourInfo(topic.tour, locale);

    let generated;
    if (process.env.ANTHROPIC_API_KEY) {
      log(`  ${locale}: генерирую текст через ${MODEL}…`);
      generated = await generateWithClaude(topic, locale, tourInfo);
    }
    if (!generated) {
      log(`  ${locale}: пишу структурную заготовку`);
      generated = buildFallback(topic, locale, tourInfo);
    }

    const markdown = renderMarkdown({
      topic,
      locale,
      generated,
      publishDate,
      tourInfo,
      author: defaults.author,
      category: defaults.category[locale] ?? defaults.category,
    });

    const target = path.join(BLOG_DIR, locale, `${slug}.md`);

    if (args.dryRun) {
      log(`  ${locale}: --dry-run, файл не записан (${path.relative(ROOT, target)})`);
      log(markdown.slice(0, 400));
    } else {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, markdown, 'utf8');
      written.push(path.relative(ROOT, target));
      log(`  ${locale}: записан ${path.relative(ROOT, target)}`);
    }
  }

  if (!args.dryRun) {
    topic.status = 'published';
    topic.publishedAt = toIsoDate(publishDate);
    await fs.writeFile(QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
    log(`тема ${topic.id} помечена как published`);
  }

  const remaining = queue.topics.filter((item) => item.status === 'pending').length;
  log(`осталось тем в очереди: ${remaining}`);

  if (process.env.GITHUB_OUTPUT && written.length > 0) {
    await fs.appendFile(
      process.env.GITHUB_OUTPUT,
      `files=${written.join(' ')}\ntopic=${topic.id}\ndate=${toIsoDate(publishDate)}\n`,
    );
  }
}

main().catch((error) => fail(error.message));
