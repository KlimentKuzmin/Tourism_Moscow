import { z } from 'zod';
import { LOCALES } from './i18n';

/** Телефон (+7…, 8…, международный) или Telegram-ник. */
const CONTACT_RE = /^(?:\+?[0-9][0-9\s\-()]{8,19}|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z
    .string()
    .trim()
    .min(5)
    .max(64)
    .refine((value) => CONTACT_RE.test(value), 'invalid_contact'),
  contactPreference: z.enum(['any', 'phone', 'telegram', 'whatsapp']).default('any'),
  tour: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  locale: z.enum(LOCALES).default('ru'),
  source: z.enum(['home', 'article', 'contacts']).default('home'),
  pageUrl: z.string().trim().max(300).optional().or(z.literal('')),
  utm: z.string().trim().max(300).optional().or(z.literal('')),
  /**
   * Honeypot: заполняется только ботами, у людей всегда пустой.
   * Схема принимает любое значение — иначе ответ подсказал бы боту,
   * какое поле его выдало. Пустоту проверяет обработчик.
   */
  company: z.string().max(200).optional(),
  /** Время рендера формы, мс. Отсекает мгновенные отправки ботами. */
  renderedAt: z.coerce.number().int().nonnegative().optional(),
});

export type Lead = z.infer<typeof leadSchema>;
