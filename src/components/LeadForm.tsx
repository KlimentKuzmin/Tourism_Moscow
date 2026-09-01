'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { getTours } from '@/lib/tours';

type Props = {
  locale: Locale;
  source: 'home' | 'article' | 'contacts';
  /** Заголовок и подпись можно переопределить — в статье они контекстные. */
  title?: string;
  subtitle?: string;
  /** Предзаполненный маршрут, например тема статьи. */
  defaultTour?: string;
  variant?: 'default' | 'inline';
  id?: string;
};

type Status = 'idle' | 'sending' | 'ok' | 'error';
type Errors = Partial<Record<'name' | 'contact', string>>;

const CONTACT_RE = /^(?:\+?[0-9][0-9\s\-()]{8,19}|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

export default function LeadForm({
  locale,
  source,
  title,
  subtitle,
  defaultTour,
  variant = 'default',
  id,
}: Props) {
  const dict = t(locale).form;
  const tours = getTours(locale);
  const renderedAt = useRef(Date.now());
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [utm, setUtm] = useState('');

  // UTM-метки берём из адреса и передаём в Telegram — так видно, откуда лид.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmPairs = [...params.entries()].filter(([key]) => key.startsWith('utm_'));
    if (utmPairs.length > 0) {
      setUtm(utmPairs.map(([key, value]) => `${key}=${value}`).join(' '));
    }
  }, []);

  const headingId = useMemo(() => `${id ?? source}-lead-form-title`, [id, source]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get('name') ?? '').trim();
    const contact = String(data.get('contact') ?? '').trim();

    const nextErrors: Errors = {};
    if (name.length < 2) nextErrors.name = dict.invalidName;
    if (!CONTACT_RE.test(contact)) nextErrors.contact = dict.invalidPhone;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('sending');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          contactPreference: String(data.get('contactPreference') ?? 'any'),
          tour: String(data.get('tour') ?? ''),
          message: String(data.get('message') ?? ''),
          company: String(data.get('company') ?? ''),
          locale,
          source,
          renderedAt: renderedAt.current,
          pageUrl: window.location.href,
          utm,
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      setStatus('ok');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'ok') {
    return (
      <div className={formClass(variant)} id={id}>
        <p className="form-status form-status--ok" role="status">
          <strong>✓ {dict.success}</strong>
          {dict.successHint}
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
          {locale === 'ru' ? 'Отправить ещё одну заявку' : 'Send another request'}
        </button>
      </div>
    );
  }

  return (
    <section className={formClass(variant)} id={id} aria-labelledby={headingId}>
      {variant === 'inline' ? (
        <h3 id={headingId}>{title ?? dict.title}</h3>
      ) : (
        <h2 id={headingId}>{title ?? dict.title}</h2>
      )}
      <p className="lead-form__subtitle">{subtitle ?? dict.subtitle}</p>

      {status === 'error' && (
        <p className="form-status form-status--error" role="alert">
          {dict.error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field-row">
          <div className={errors.name ? 'field field--error' : 'field'}>
            <label htmlFor={`${headingId}-name`}>{dict.name} *</label>
            <input
              id={`${headingId}-name`}
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder={dict.namePlaceholder}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${headingId}-name-error` : undefined}
            />
            {errors.name && (
              <span className="field__error" id={`${headingId}-name-error`}>
                {errors.name}
              </span>
            )}
          </div>

          <div className={errors.contact ? 'field field--error' : 'field'}>
            <label htmlFor={`${headingId}-contact`}>{dict.phone} *</label>
            <input
              id={`${headingId}-contact`}
              name="contact"
              type="text"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder={dict.phonePlaceholder}
              aria-invalid={Boolean(errors.contact)}
              aria-describedby={errors.contact ? `${headingId}-contact-error` : undefined}
            />
            {errors.contact && (
              <span className="field__error" id={`${headingId}-contact-error`}>
                {errors.contact}
              </span>
            )}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${headingId}-preference`}>{dict.contactPreference}</label>
            <select id={`${headingId}-preference`} name="contactPreference" defaultValue="any">
              <option value="any">{locale === 'ru' ? 'Любой' : 'Any'}</option>
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">{locale === 'ru' ? 'Звонок' : 'Phone call'}</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor={`${headingId}-tour`}>{dict.tour}</label>
            <select id={`${headingId}-tour`} name="tour" defaultValue={defaultTour ?? ''}>
              <option value="">{dict.tourPlaceholder}</option>
              {defaultTour && !tours.some((tour) => tour.name === defaultTour) && (
                <option value={defaultTour}>{defaultTour}</option>
              )}
              {tours.map((tour) => (
                <option key={tour.id} value={tour.name}>
                  {tour.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${headingId}-message`}>{dict.message}</label>
          <textarea
            id={`${headingId}-message`}
            name="message"
            rows={3}
            placeholder={dict.messagePlaceholder}
          />
        </div>

        {/* Honeypot: скрыт от людей, заполняется ботами. */}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor={`${headingId}-company`}>Company</label>
          <input id={`${headingId}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
          {status === 'sending' ? dict.submitting : dict.submit}
        </button>

        <p className="form-consent">
          {dict.consent}{' '}
          <a href={`/${locale}/privacy`}>{dict.privacy}</a>.
        </p>
      </form>
    </section>
  );
}

function formClass(variant: 'default' | 'inline'): string {
  return variant === 'inline' ? 'lead-form lead-form--inline' : 'lead-form';
}
