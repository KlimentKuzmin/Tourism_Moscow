import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

/** Динамическая картинка для соцсетей: /api/og?title=... */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? 'Экскурсии по Москве').slice(0, 120);
  const subtitle = searchParams.get('subtitle') ?? 'Москва Тревел';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #1c1a17 0%, #4a1416 60%, #9b2226 100%)',
          color: '#fbfaf8',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, opacity: 0.85 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#9b2226',
              fontWeight: 700,
            }}
          >
            М
          </div>
          {subtitle}
        </div>

        <div style={{ display: 'flex', fontSize: title.length > 70 ? 54 : 68, fontWeight: 700, lineHeight: 1.15 }}>
          {title}
        </div>

        <div style={{ display: 'flex', fontSize: 26, color: '#d6a955' }}>
          tourism-moscow · авторские экскурсии и туры
        </div>
      </div>
    ),
    SIZE,
  );
}
