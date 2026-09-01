import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/lead-schema';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import {
  TelegramNotConfiguredError,
  TelegramSendError,
  sendLeadToTelegram,
} from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Быстрее этого форму не заполняет человек — почти наверняка бот. */
const MIN_FILL_MS = 2_000;

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const lead = parsed.data;

  // Ловушки для ботов. Отвечаем 200, чтобы спамер не подбирал обход.
  if (lead.company) return NextResponse.json({ ok: true });
  if (lead.renderedAt && Date.now() - lead.renderedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendLeadToTelegram(lead, {
      pageUrl: lead.pageUrl || undefined,
      utm: lead.utm || undefined,
      receivedAt: new Date(),
    });
  } catch (error) {
    if (error instanceof TelegramNotConfiguredError) {
      // Без настроенного бота заявку нельзя потерять молча: пишем в лог платформы.
      console.error('[lead] Telegram is not configured, lead logged instead:', {
        name: lead.name,
        contact: lead.contact,
        tour: lead.tour,
        pageUrl: lead.pageUrl,
      });
      return NextResponse.json({ ok: false, error: 'telegram_not_configured' }, { status: 503 });
    }

    const status = error instanceof TelegramSendError ? 502 : 500;
    console.error('[lead] failed to deliver lead:', error);
    return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
}
