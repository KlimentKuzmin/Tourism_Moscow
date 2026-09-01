#!/usr/bin/env node
/**
 * Проверяет расписание блога и вводит в строй статьи, у которых наступила дата.
 *
 * Что делает:
 *   1. читает фронтматтер всех статей и валидирует обязательные поля;
 *   2. показывает, что уже опубликовано и что стоит в очереди;
 *   3. дёргает /api/cron/publish на боевом сайте, чтобы сбросить кеш блога —
 *      статьи с наступившей датой появляются без пересборки.
 *
 * Переменные окружения:
 *   SITE_URL     — адрес сайта (например https://tourism-moscow.ru)
 *   CRON_SECRET  — тот же секрет, что задан в окружении сайта
 *
 * Запуск:
 *   node scripts/publish-scheduled.mjs            # проверка + ревалидация
 *   node scripts/publish-scheduled.mjs --check    # только проверка, без сети
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const LOCALES = ['ru', 'en'];
const REQUIRED = ['title', 'description', 'date'];

const checkOnly = process.argv.includes('--check');

function log(message) {
  process.stdout.write(`${message}\n`);
}

/** Минимальный парсер фронтматтера: нужны только скалярные поля верхнего уровня. */
function readFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!match) return null;

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (!field) continue;
    const value = field[2].trim();
    if (!value) continue;
    data[field[1]] = value.replace(/^["']|["']$/g, '');
  }
  return data;
}

async function collect() {
  const posts = [];

  for (const locale of LOCALES) {
    const dir = path.join(BLOG_DIR, locale);
    let files = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }

    for (const file of files.filter((name) => name.endsWith('.md'))) {
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      const data = readFrontmatter(raw);
      const slug = file.replace(/\.md$/, '');

      if (!data) {
        posts.push({ locale, slug, error: 'нет фронтматтера' });
        continue;
      }

      const missing = REQUIRED.filter((key) => !data[key]);
      if (missing.length > 0) {
        posts.push({ locale, slug, error: `нет полей: ${missing.join(', ')}` });
        continue;
      }

      const date = new Date(data.date);
      if (Number.isNaN(date.getTime())) {
        posts.push({ locale, slug, error: `некорректная дата: ${data.date}` });
        continue;
      }

      posts.push({
        locale,
        slug,
        title: data.title,
        date,
        draft: data.draft === 'true',
      });
    }
  }

  return posts;
}

async function revalidate() {
  const siteUrl = process.env.SITE_URL?.replace(/\/+$/, '');
  if (!siteUrl) {
    log('SITE_URL не задан — ревалидацию пропускаю');
    return;
  }

  const headers = process.env.CRON_SECRET
    ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
    : {};

  const endpoint = `${siteUrl}/api/cron/publish`;
  log(`\nревалидация: ${endpoint}`);

  const response = await fetch(endpoint, { headers });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`сайт ответил ${response.status}: ${body.slice(0, 300)}`);
  }
  log(body);
}

async function main() {
  const posts = await collect();
  const now = new Date();

  const broken = posts.filter((post) => post.error);
  const live = posts.filter((post) => !post.error && !post.draft && post.date <= now);
  const scheduled = posts
    .filter((post) => !post.error && !post.draft && post.date > now)
    .sort((a, b) => a.date - b.date);
  const drafts = posts.filter((post) => !post.error && post.draft);

  log(`опубликовано: ${live.length}`);
  log(`ждут даты: ${scheduled.length}`);
  log(`черновики: ${drafts.length}`);

  if (scheduled.length > 0) {
    log('\nближайшие публикации:');
    for (const post of scheduled.slice(0, 10)) {
      const days = Math.ceil((post.date - now) / 86_400_000);
      log(`  ${post.date.toISOString().slice(0, 10)} (через ${days} дн.) [${post.locale}] ${post.title}`);
    }
  }

  if (broken.length > 0) {
    log('\nпроблемы во фронтматтере:');
    for (const post of broken) {
      log(`  [${post.locale}] ${post.slug}: ${post.error}`);
    }
    process.exitCode = 1;
    return;
  }

  if (!checkOnly) {
    await revalidate();
  }
}

main().catch((error) => {
  process.stderr.write(`ошибка: ${error.message}\n`);
  process.exit(1);
});
