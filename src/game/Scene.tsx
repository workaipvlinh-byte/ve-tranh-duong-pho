import { memo } from 'react';
import { CANVAS } from './layout';

const INK = '#3a2418';
const ol = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const };

/** 1 dãy nhà phố cổ: tường vàng, mái ngói âm dương, cửa gỗ, đèn lồng */
function House({ x, y, w, h, wall, door }: { x: number; y: number; w: number; h: number; wall: string; door: string }) {
  const roofH = 70;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={wall} {...ol} />
      <path d={`M ${x - 24} ${y + 10} L ${x + 20} ${y - roofH} L ${x + w - 20} ${y - roofH} L ${x + w + 24} ${y + 10} Z`} fill="#8c3b22" {...ol} />
      {Array.from({ length: Math.floor((w + 30) / 22) }, (_, i) => (
        <path key={i} d={`M ${x - 10 + i * 22} ${y + 4} L ${x + 26 + i * 22 - 6} ${y - roofH + 6}`} stroke="#6b2a16" strokeWidth={4} />
      ))}
      {/* tầng trên: cửa sổ chớp */}
      <rect x={x + w * 0.18} y={y + 40} width={w * 0.26} height={92} fill={door} {...ol} />
      <rect x={x + w * 0.56} y={y + 40} width={w * 0.26} height={92} fill={door} {...ol} />
      <path d={`M ${x} ${y + 168} L ${x + w} ${y + 168}`} stroke={INK} strokeWidth={5} />
      {/* ban công + hoa giấy */}
      <rect x={x + 6} y={y + 152} width={w - 12} height={16} fill="#5b3a29" />
      {[0.15, 0.3, 0.45, 0.7, 0.85].map((f, i) => (
        <circle key={i} cx={x + w * f} cy={y + 146} r={16} fill={i % 2 ? '#e8508b' : '#ff7eb3'} />
      ))}
      {/* tầng dưới: cửa gỗ */}
      <rect x={x + w * 0.2} y={y + 210} width={w * 0.6} height={h - 210} fill={door} {...ol} />
      {[1, 2, 3].map((i) => (
        <path key={i} d={`M ${x + w * 0.2 + (w * 0.6 * i) / 4} ${y + 210} L ${x + w * 0.2 + (w * 0.6 * i) / 4} ${y + h}`} stroke={INK} strokeWidth={3} />
      ))}
    </g>
  );
}

function Lantern({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="lantern">
      <path d="M 0 -40 L 0 -6" stroke={INK} strokeWidth={3} />
      <ellipse cx={0} cy={24} rx={30} ry={34} fill={c} {...ol} />
      <path d="M -14 -6 Q -22 24 -14 56 M 14 -6 Q 22 24 14 56" stroke="rgba(0,0,0,0.25)" strokeWidth={3} fill="none" />
      <rect x={-14} y={-12} width={28} height={10} rx={3} fill="#d4a017" {...ol} strokeWidth={3} />
      <rect x={-14} y={54} width={28} height={10} rx={3} fill="#d4a017" {...ol} strokeWidth={3} />
      <path d="M 0 64 L 0 92" stroke="#d4a017" strokeWidth={4} />
      <ellipse cx={0} cy={24} rx={18} ry={22} fill="rgba(255,240,180,0.35)" />
    </g>
  );
}

/** Nền tĩnh: trời chiều, sông, cầu mái ngói, nhà phố, sân gạch, giá vẽ. Vẽ 1 lần (memo). */
export const Scene = memo(function Scene() {
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} className="absolute inset-0">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a8" />
          <stop offset="1" stopColor="#ffeccf" />
        </linearGradient>
        <pattern id="brick" width="120" height="60" patternUnits="userSpaceOnUse">
          <rect width="120" height="60" fill="#d98b5f" />
          <path d="M 0 0 H 120 M 0 30 H 120 M 60 0 V 30 M 0 30 V 60 M 120 30 V 60" stroke="#b86a43" strokeWidth="4" />
        </pattern>
      </defs>

      <rect width="1080" height="800" fill="url(#sky)" />
      {/* mặt trời + mây */}
      <circle cx={860} cy={230} r={70} fill="#ffb347" opacity={0.9} />
      <g fill="#fff8ee" stroke={INK} strokeWidth={4}>
        <path d="M 120 250 q 10 -40 60 -30 q 20 -40 70 -14 q 50 -6 46 40 Z" />
        <path d="M 640 170 q 12 -34 54 -26 q 22 -34 64 -10 q 44 -2 40 36 Z" />
      </g>

      {/* sông + cầu mái ngói phía xa */}
      <rect x={0} y={620} width={1080} height={180} fill="#5fb3b3" />
      {[650, 690, 730, 770].map((y, i) => (
        <path key={y} d={`M ${40 + i * 60} ${y} q 30 -10 60 0 M ${520 - i * 40} ${y + 10} q 30 -10 60 0 M ${780 + i * 20} ${y - 4} q 30 -10 60 0`} stroke="#d9f2f2" strokeWidth={4} fill="none" />
      ))}
      <g>
        <path d="M 330 640 Q 540 560 750 640" stroke={INK} strokeWidth={6} fill="none" />
        <rect x={430} y={520} width={220} height={96} fill="#e9b949" {...ol} />
        <path d="M 400 528 L 450 470 L 630 470 L 680 528 Z" fill="#8c3b22" {...ol} />
        <path d="M 470 470 L 540 440 L 610 470" fill="#8c3b22" {...ol} />
        {[455, 505, 555, 605].map((x) => (
          <rect key={x} x={x} y={548} width={26} height={68} fill="#5b3a29" />
        ))}
      </g>
      {/* thuyền */}
      <path d="M 170 720 Q 240 760 330 720 L 312 704 Q 240 724 188 704 Z" fill="#7b4b2a" {...ol} />
      <path d="M 220 704 Q 250 670 286 704" fill="#e9c46a" {...ol} />

      {/* nhà phố hai bên */}
      <House x={-20} y={330} w={230} h={470} wall="#f2c14e" door="#3f6f6a" />
      <House x={230} y={390} w={150} h={410} wall="#f6d06f" door="#7a4b2a" />
      <House x={870} y={330} w={230} h={470} wall="#f2c14e" door="#7a4b2a" />
      <House x={740} y={410} w={140} h={390} wall="#efb93f" door="#3f6f6a" />

      {/* sân gạch */}
      <rect x={0} y={800} width={1080} height={1120} fill="url(#brick)" />
      <rect x={0} y={800} width={1080} height={14} fill="#8a4b2e" />

      {/* dây đèn lồng phía trước */}
      <path d="M -10 120 Q 540 210 1090 120" stroke={INK} strokeWidth={4} fill="none" />
      {[
        [90, 138, '#e63946'],
        [250, 160, '#f4a261'],
        [830, 160, '#2a9d8f'],
        [990, 138, '#f4a261'],
      ].map(([x, y, c]) => (
        <Lantern key={x} x={x as number} y={y as number} c={c as string} s={0.8} />
      ))}

      {/* giá vẽ (khung tranh đặt lên trên bằng canvas) */}
      <g>
        <path d={`M ${CANVAS.x + 40} ${CANVAS.y + CANVAS.size} L ${CANVAS.x - 10} 1490`} stroke="#6b4226" strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${CANVAS.x + CANVAS.size - 40} ${CANVAS.y + CANVAS.size} L ${CANVAS.x + CANVAS.size + 10} 1490`} stroke="#6b4226" strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${CANVAS.x + CANVAS.size / 2} ${CANVAS.y - 40} L ${CANVAS.x + CANVAS.size / 2} 1440`} stroke="#5a3620" strokeWidth={20} strokeLinecap="round" />
        <rect x={CANVAS.x - 22} y={CANVAS.y - 22} width={CANVAS.size + 44} height={CANVAS.size + 44} rx={10} fill="#8b5a2b" {...ol} />
        <rect x={CANVAS.x - 40} y={CANVAS.y + CANVAS.size + 18} width={CANVAS.size + 80} height={26} rx={8} fill="#6b4226" {...ol} />
        <ellipse cx={CANVAS.x + CANVAS.size / 2} cy={1494} rx={250} ry={18} fill="rgba(60,30,10,0.2)" />
      </g>
    </svg>
  );
});
