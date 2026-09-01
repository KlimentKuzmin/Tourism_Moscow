import type { Lead } from './lead-schema';

/** По умолчанию официальный API; переопределяется, если Telegram ходит через прокси. */
const TELEGRAM_API = process.env.TELEGRAM_API_BASE?.replace(/\/+$/, '') || 'https://api.telegram.org';

export class TelegramNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Telegram is not configured, missing env: ${missing.join(', ')}`);
    this.name = 'TelegramNotConfiguredError';
  }
}

export class TelegramSendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TelegramSendError';
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function row(label: string, value?: string | null): string {
  if (!value) return '';
  return `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}\n`;
}

/** Собирает сообщение в HTML-разметке Telegram (parse_mode: HTML). */
export function formatLeadMessage(lead: Lead, meta: LeadMeta): string {
  const title = lead.source === 'article' ? '🧭 Заявка из статьи' : '🏛 Заявка с сайта';
  const submittedAt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(meta.receivedAt);

  return (
    `<b>${title}</b>\n\n` +
    row('Имя', lead.name) +
    row('Контакт', lead.contact) +
    row('Способ связи', CONTACT_LABEL[lead.contactPreference]) +
    row('Маршрут', lead.tour) +
    row('Комментарий', lead.message) +
    '\n' +
    row('Страница', meta.pageUrl) +
    row('Язык', lead.locale) +
    row('UTM', meta.utm) +
    row('Время (МСК)', submittedAt)
  ).trim();
}

const CONTACT_LABEL: Record<Lead['contactPreference'], string> = {
  any: 'Любой',
  phone: 'Звонок',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};

export type LeadMeta = {
  pageUrl?: string;
  utm?: string;
  receivedAt: Date;
};

/**
 * Отправляет заявку в Telegram-чат.
 * Бросает TelegramNotConfiguredError, если переменные окружения не заданы,
 * и TelegramSendError, если Telegram ответил ошибкой.
 */
export async function sendLeadToTelegram(lead: Lead, meta: LeadMeta): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_THREAD_ID;

  const missing: string[] = [];
  if (!token) missing.push('TELEGRAM_BOT_TOKEN');
  if (!chatId) missing.push('TELEGRAM_CHAT_ID');
  if (missing.length > 0) throw new TelegramNotConfiguredError(missing);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        ...(threadId ? { message_thread_id: Number(threadId) } : {}),
        text: formatLeadMessage(lead, meta),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new TelegramSendError(
        `Telegram API responded ${response.status}: ${body.slice(0, 300)}`,
        response.status,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}
