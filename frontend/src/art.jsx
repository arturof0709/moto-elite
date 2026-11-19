// Ilustraciones vectoriales propias (no necesitan internet ni archivos de imagen).
// Cada producto se dibuja según su tipo; el color de acento cambia por categoría.

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' };
const BODY = 'var(--art-body, #2f4259)';
const DARK = 'var(--art-dark, #141c27)';

export const TINTS = {
  casco: '#f5c518',
  escape: '#ff8a3d',
  freno: '#ff5d5d',
  suspension: '#4db8ff',
  chaqueta: '#5ad19a',
  guantes: '#5ad19a',
  botas: '#5ad19a',
  filtro: '#b48cff'
};

// Decide qué ilustración usar a partir del nombre / categoría del producto
export function kindOf(nombre = '', categoria = '') {
  const t = `${nombre} ${categoria}`.toLowerCase();
  if (t.includes('casco')) return 'casco';
  if (t.includes('chaqueta')) return 'chaqueta';
  if (t.includes('guante')) return 'guantes';
  if (t.includes('bota')) return 'botas';
  if (t.includes('escape') || t.includes('silenciador')) return 'escape';
  if (t.includes('filtro')) return 'filtro';
  if (t.includes('amortiguador') || t.includes('horquilla') || t.includes('suspens')) return 'suspension';
  if (t.includes('freno') || t.includes('pastilla') || t.includes('brembo')) return 'freno';
  if (t.includes('protec')) return 'chaqueta';
  return 'casco';
}

const Casco = () => (
  <g>
    <path d="M38 104 C30 52 68 20 108 22 C150 24 174 58 168 100 L168 108 C168 114 162 118 156 118 L84 118 C70 118 60 112 56 104 Z" fill={BODY} {...S} />
    <path d="M94 60 C128 54 158 62 166 84 L100 88 C92 80 90 68 94 60 Z" fill={DARK} {...S} />
    <path d="M56 54 C84 30 138 28 160 50" {...S} strokeWidth={7} />
    <path d="M70 96 H88 M70 104 H84" {...S} strokeWidth={3} />
    <path d="M150 100 H162" {...S} strokeWidth={3} />
    <circle cx="116" cy="36" r="4" fill="currentColor" />
  </g>
);

const Escape = () => (
  <g>
    <path d="M26 34 C70 34 62 96 108 96 H146" {...S} strokeWidth={9} />
    <path d="M26 50 C60 50 54 108 104 108 H146" {...S} strokeWidth={9} opacity=".55" />
    <rect x="16" y="22" width="10" height="40" rx="3" fill="currentColor" />
    <rect x="138" y="82" width="52" height="36" rx="18" fill={BODY} {...S} />
    <ellipse cx="186" cy="100" rx="6" ry="14" fill={DARK} {...S} strokeWidth={3} />
    <path d="M150 90 H174 M150 110 H174" {...S} strokeWidth={3} opacity=".7" />
  </g>
);

const Freno = () => {
  const holes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return <circle key={i} cx={96 + Math.cos(a) * 34} cy={70 + Math.sin(a) * 34} r="4.5" fill={DARK} />;
  });
  return (
    <g>
      <circle cx="96" cy="70" r="54" fill={BODY} {...S} />
      <circle cx="96" cy="70" r="20" fill={DARK} {...S} />
      <circle cx="96" cy="70" r="7" fill="currentColor" />
      {holes}
      <path d="M142 28 A62 62 0 0 1 142 112 L128 102 A46 46 0 0 0 128 38 Z" fill="currentColor" stroke={DARK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="132" y="56" width="14" height="28" rx="4" fill={DARK} />
    </g>
  );
};

const Suspension = () => {
  const pts = Array.from({ length: 9 }, (_, i) => `${i % 2 ? 76 : 124},${34 + i * 9}`).join(' ');
  return (
    <g>
      <circle cx="100" cy="14" r="9" fill={DARK} {...S} />
      <circle cx="100" cy="126" r="9" fill={DARK} {...S} />
      <rect x="92" y="24" width="16" height="30" rx="4" fill={BODY} {...S} strokeWidth={3} />
      <rect x="96" y="96" width="8" height="22" rx="3" fill="currentColor" />
      <polyline points={`100,30 ${pts} 100,106`} {...S} strokeWidth={5} />
      <rect x="140" y="40" width="22" height="46" rx="8" fill={BODY} {...S} strokeWidth={3} />
      <path d="M124 56 H140" {...S} strokeWidth={3} />
      <circle cx="151" cy="52" r="3" fill="currentColor" />
    </g>
  );
};

const Chaqueta = () => (
  <g>
    <path d="M74 18 L100 30 L126 18 L168 40 L186 100 L158 108 L150 78 L150 126 L50 126 L50 78 L42 108 L14 100 L32 40 Z" fill={BODY} {...S} />
    <path d="M100 30 V126" {...S} strokeWidth={3} />
    <path d="M60 52 H92 M108 52 H140" {...S} strokeWidth={3} opacity=".7" />
    <path d="M26 66 L40 72 M174 66 L160 72" {...S} strokeWidth={6} />
    <rect x="62" y="84" width="28" height="12" rx="3" fill={DARK} />
    <rect x="110" y="84" width="28" height="12" rx="3" fill={DARK} />
    <path d="M74 18 C80 34 120 34 126 18" {...S} strokeWidth={3} />
  </g>
);

const Guantes = () => (
  <g>
    <path d="M62 76 V30 a8 8 0 0 1 16 0 V62 V20 a8 8 0 0 1 16 0 V60 V18 a8 8 0 0 1 16 0 V62 V28 a8 8 0 0 1 16 0 V84 C126 96 140 92 150 78 L156 66 a8 8 0 0 1 14 8 L158 100 C150 118 134 122 112 122 H84 C70 122 62 112 62 100 Z" fill={BODY} {...S} strokeWidth={3.5} />
    <rect x="58" y="116" width="76" height="20" rx="6" fill={DARK} {...S} strokeWidth={3.5} />
    <path d="M70 90 H122" {...S} strokeWidth={6} />
    <circle cx="76" cy="46" r="3" fill="currentColor" /><circle cx="108" cy="42" r="3" fill="currentColor" />
  </g>
);

const Botas = () => (
  <g>
    <path d="M70 12 H116 V70 L158 84 C176 90 178 118 160 118 H58 C50 118 46 112 48 104 L56 70 Z" fill={BODY} {...S} />
    <path d="M48 104 H172" {...S} strokeWidth={6} />
    <path d="M70 36 H116 M68 52 H116" {...S} strokeWidth={3} opacity=".7" />
    <rect x="66" y="26" width="54" height="8" rx="3" fill="currentColor" />
    <path d="M132 92 L150 98" {...S} strokeWidth={3} />
  </g>
);

const Filtro = () => {
  const lines = Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${54 + i * 11.5} 40 V108`} {...S} strokeWidth={2.5} opacity=".7" />);
  return (
    <g>
      <rect x="44" y="32" width="112" height="84" rx="4" fill={BODY} {...S} />
      {lines}
      <ellipse cx="100" cy="32" rx="62" ry="14" fill={DARK} {...S} />
      <ellipse cx="100" cy="32" rx="30" ry="6" fill={BODY} {...S} strokeWidth={3} />
      <path d="M38 116 C38 128 162 128 162 116" {...S} />
      <path d="M44 108 C44 122 156 122 156 108" {...S} strokeWidth={3} opacity=".6" />
    </g>
  );
};

const PIECES = { casco: Casco, escape: Escape, freno: Freno, suspension: Suspension, chaqueta: Chaqueta, guantes: Guantes, botas: Botas, filtro: Filtro };

export function ProductArt({ kind, className = '' }) {
  const Piece = PIECES[kind] || Casco;
  return (
    <svg className={`art ${className}`} viewBox="0 0 200 140" role="img" aria-hidden="true" style={{ color: TINTS[kind] || '#f5c518' }}>
      <Piece />
    </svg>
  );
}

// Moto deportiva (dibujo original) para el hero
export function HeroBike() {
  const spokes = (cx) => Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return <line key={i} x1={cx + Math.cos(a) * 14} y1={250 + Math.sin(a) * 14} x2={cx + Math.cos(a) * 52} y2={250 + Math.sin(a) * 52} stroke="#5d7490" strokeWidth="3" />;
  });
  return (
    <svg className="bike" viewBox="0 0 640 380" role="img" aria-label="Ilustración de una moto deportiva">
      <defs>
        <linearGradient id="gBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd84a" /><stop offset="1" stopColor="#e0a800" />
        </linearGradient>
      </defs>
      {/* estelas de velocidad */}
      <g className="speed" stroke="#f5c518" strokeLinecap="round" strokeWidth="4" opacity=".55">
        <line x1="6" y1="120" x2="110" y2="120" /><line x1="30" y1="160" x2="140" y2="160" />
        <line x1="0" y1="200" x2="80" y2="200" /><line x1="20" y1="300" x2="100" y2="300" />
      </g>
      <ellipse cx="320" cy="336" rx="270" ry="14" fill="#000" opacity=".35" />
      {/* ruedas */}
      {[140, 500].map((cx) => (
        <g key={cx} className="wheel" style={{ transformOrigin: `${cx}px 250px` }}>
          <circle cx={cx} cy="250" r="78" fill="#0f151d" stroke="#0a0e14" strokeWidth="6" />
          <circle cx={cx} cy="250" r="56" fill="none" stroke="#8fa4bb" strokeWidth="6" />
          {spokes(cx)}
          <circle cx={cx} cy="250" r="10" fill="#f5c518" />
        </g>
      ))}
      {/* disco delantero */}
      <circle cx="500" cy="250" r="30" fill="none" stroke="#c9d4e0" strokeWidth="3" opacity=".6" />
      {/* basculante + motor */}
      <path d="M140 250 L290 236" stroke="#3a4d66" strokeWidth="16" strokeLinecap="round" />
      <path d="M262 206 H372 L388 262 H284 Z" fill="#2b3b50" stroke="#0f151d" strokeWidth="4" strokeLinejoin="round" />
      <path d="M280 226 H372 M284 244 H382" stroke="#4a6180" strokeWidth="4" />
      {/* escape */}
      <path d="M300 268 C340 292 220 300 150 262 L100 232 L86 216" fill="none" stroke="#9fb0c3" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M86 216 L74 204" stroke="#4a6180" strokeWidth="16" strokeLinecap="round" />
      {/* horquilla */}
      <path d="M452 146 L500 250" stroke="#c9d4e0" strokeWidth="9" strokeLinecap="round" />
      <path d="M440 140 L488 242" stroke="#6b8099" strokeWidth="9" strokeLinecap="round" />
      {/* cola */}
      <path d="M86 176 C140 150 220 150 262 168 L254 196 C200 190 140 196 100 204 C84 204 76 190 86 176 Z" fill="url(#gBody)" stroke="#0f151d" strokeWidth="4" strokeLinejoin="round" />
      {/* asiento */}
      <path d="M180 156 C214 144 258 148 280 160 L260 174 C230 164 202 166 180 170 Z" fill="#141c27" stroke="#0f151d" strokeWidth="4" strokeLinejoin="round" />
      {/* depósito */}
      <path d="M262 164 C300 128 372 124 410 146 L400 190 C360 172 300 176 262 196 Z" fill="url(#gBody)" stroke="#0f151d" strokeWidth="4" strokeLinejoin="round" />
      {/* carenado */}
      <path d="M404 142 C440 134 478 150 498 182 L478 214 C452 222 420 218 392 206 C388 176 392 156 404 142 Z" fill="url(#gBody)" stroke="#0f151d" strokeWidth="4" strokeLinejoin="round" />
      <path d="M434 138 C452 112 470 104 486 100 L478 142 Z" fill="#1d2a3a" stroke="#0f151d" strokeWidth="4" strokeLinejoin="round" opacity=".9" />
      <path d="M462 168 L494 178 L486 190 L458 184 Z" fill="#fff7cf" />
      {/* manillar */}
      <path d="M418 130 L440 120 L452 124" fill="none" stroke="#0f151d" strokeWidth="8" strokeLinecap="round" />
      {/* franja */}
      <path d="M290 150 C330 140 372 146 396 160" fill="none" stroke="#141c27" strokeWidth="6" strokeLinecap="round" />
      <path d="M130 188 C170 176 214 176 250 188" fill="none" stroke="#141c27" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

// Íconos pequeños para beneficios
export const Icon = {
  truck: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L16 9.5" />,
  wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
};
