import { memo, useId, type ReactNode } from 'react';
import { CANVAS } from './layout';

// 10 nền. Chủ kênh chọn ở trang điều khiển (không đổi ngẫu nhiên). Phần trời/cảnh nằm trên (y < 800), sân dưới (y >= 800).
export const BACKGROUNDS = [
  { name: 'Phố Hội chiều', en: 'Hoi An sunset' },
  { name: 'Phố Hội đêm', en: 'Hoi An night' },
  { name: 'Chợ hoa Tết', en: 'Lunar New Year market' },
  { name: 'Bãi biển', en: 'Beach' },
  { name: 'Đồng lúa', en: 'Rice fields' },
  { name: 'Vườn hoa', en: 'Flower garden' },
  { name: 'Phố tuyết', en: 'Snowy town' },
  { name: 'Phố đêm neon', en: 'Neon city' },
  { name: 'Làng tre', en: 'Bamboo village' },
  { name: 'Xưởng trong nhà', en: 'Indoor studio' },
];

const INK = '#3a2418';
const ol = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const };
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Nhà phố: tường, mái ngói, cửa chớp, ban công hoa */
function House({ x, y, w, h, wall, door, roof = '#8c3b22', lit, snow }: { x: number; y: number; w: number; h: number; wall: string; door: string; roof?: string; lit?: boolean; snow?: boolean }) {
  const roofH = 70;
  const win = lit ? '#ffd27a' : door;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={wall} {...ol} />
      <path d={`M ${x - 24} ${y + 10} L ${x + 20} ${y - roofH} L ${x + w - 20} ${y - roofH} L ${x + w + 24} ${y + 10} Z`} fill={roof} {...ol} />
      {!snow &&
        range(Math.floor((w + 30) / 22)).map((i) => (
          <path key={i} d={`M ${x - 10 + i * 22} ${y + 4} L ${x + 20 + i * 22} ${y - roofH + 6}`} stroke="rgba(0,0,0,0.2)" strokeWidth={4} />
        ))}
      {snow && <path d={`M ${x - 26} ${y + 8} Q ${x + w / 2} ${y - 20} ${x + w + 26} ${y + 8} L ${x + w + 10} ${y + 22} Q ${x + w / 2} ${y} ${x - 10} ${y + 22} Z`} fill="#fff" {...ol} strokeWidth={3} />}
      <rect x={x + w * 0.18} y={y + 40} width={w * 0.26} height={92} fill={win} {...ol} />
      <rect x={x + w * 0.56} y={y + 40} width={w * 0.26} height={92} fill={win} {...ol} />
      <rect x={x + 6} y={y + 152} width={w - 12} height={16} fill="#5b3a29" />
      {!snow && [0.15, 0.3, 0.45, 0.7, 0.85].map((f, i) => <circle key={i} cx={x + w * f} cy={y + 146} r={16} fill={i % 2 ? '#e8508b' : '#ff7eb3'} />)}
      <rect x={x + w * 0.2} y={y + 210} width={w * 0.6} height={h - 210} fill={lit ? '#e0a94a' : door} {...ol} />
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

// id gradient/pattern phải riêng cho từng bản vẽ (trang điều khiển hiện 10 nền nhỏ cùng lúc)
const Sky = ({ u, a, b, h = 800 }: { u: string; a: string; b: string; h?: number }) => (
  <>
    <defs>
      <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={a} />
        <stop offset="1" stopColor={b} />
      </linearGradient>
    </defs>
    <rect width="1080" height={h} fill={`url(#${u}sky)`} />
  </>
);
const Clouds = ({ fill = '#fff8ee' }: { fill?: string }) => (
  <g fill={fill} stroke={INK} strokeWidth={4}>
    <path d="M 120 250 q 10 -40 60 -30 q 20 -40 70 -14 q 50 -6 46 40 Z" />
    <path d="M 640 170 q 12 -34 54 -26 q 22 -34 64 -10 q 44 -2 40 36 Z" />
  </g>
);
function River({ color, wave }: { color: string; wave: string }) {
  return (
    <g>
      <rect x={0} y={620} width={1080} height={180} fill={color} />
      {[650, 690, 730, 770].map((y, i) => (
        <path key={y} d={`M ${40 + i * 60} ${y} q 30 -10 60 0 M ${520 - i * 40} ${y + 10} q 30 -10 60 0 M ${780 + i * 20} ${y - 4} q 30 -10 60 0`} stroke={wave} strokeWidth={4} fill="none" />
      ))}
    </g>
  );
}
function Bridge({ wall = '#e9b949', lit }: { wall?: string; lit?: boolean }) {
  return (
    <g>
      <path d="M 330 640 Q 540 560 750 640" stroke={INK} strokeWidth={6} fill="none" />
      <rect x={430} y={520} width={220} height={96} fill={wall} {...ol} />
      <path d="M 400 528 L 450 470 L 630 470 L 680 528 Z" fill="#8c3b22" {...ol} />
      <path d="M 470 470 L 540 440 L 610 470" fill="#8c3b22" {...ol} />
      {[455, 505, 555, 605].map((x) => (
        <rect key={x} x={x} y={548} width={26} height={68} fill={lit ? '#ffd27a' : '#5b3a29'} />
      ))}
    </g>
  );
}
function Tree({ x, y, r, leaf, flower }: { x: number; y: number; r: number; leaf: string; flower?: string }) {
  return (
    <g>
      <path d={`M ${x} ${y + r * 2.4} L ${x} ${y}`} stroke="#6b4226" strokeWidth={r * 0.35} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r} fill={leaf} {...ol} />
      <circle cx={x - r * 0.7} cy={y + r * 0.3} r={r * 0.7} fill={leaf} {...ol} />
      <circle cx={x + r * 0.7} cy={y + r * 0.25} r={r * 0.75} fill={leaf} {...ol} />
      {flower && range(9).map((i) => <circle key={i} cx={x + Math.cos(i * 2.4) * r * 0.9} cy={y + Math.sin(i * 2.4) * r * 0.6} r={r * 0.14} fill={flower} />)}
    </g>
  );
}
function Palm({ x, flip }: { x: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 0) scale(${flip ? -1 : 1} 1)`}>
      <path d="M 0 800 Q 30 600 90 420" stroke="#8b5a2b" strokeWidth={28} fill="none" strokeLinecap="round" />
      {[-60, -20, 20, 60, 100].map((a) => (
        <path key={a} d="M 90 420 q 70 -30 150 30 q -80 -10 -150 -30 Z" fill="#2a9d8f" {...ol} strokeWidth={4} transform={`rotate(${a} 90 420)`} />
      ))}
    </g>
  );
}

// ---------- sân (từ y 800) ----------
type Floor = 'brick' | 'sand' | 'grass' | 'snow' | 'asphalt' | 'wood' | 'dirt' | 'tile';
const FLOOR: Record<Floor, { edge: string; tile: ReactNode }> = {
  brick: {
    edge: '#8a4b2e',
    tile: (
      <>
        <rect width="120" height="60" fill="#d98b5f" />
        <path d="M 0 0 H 120 M 0 30 H 120 M 60 0 V 30 M 0 30 V 60 M 120 30 V 60" stroke="#b86a43" strokeWidth="4" />
      </>
    ),
  },
  tile: {
    edge: '#9b3b2a',
    tile: (
      <>
        <rect width="120" height="60" fill="#e9a07a" />
        <path d="M 0 0 H 120 M 0 30 H 120 M 60 0 V 30 M 0 30 V 60 M 120 30 V 60" stroke="#c2563c" strokeWidth="4" />
        <circle cx="30" cy="15" r="4" fill="#f6d06f" />
      </>
    ),
  },
  sand: {
    edge: '#d9b574',
    tile: (
      <>
        <rect width="120" height="60" fill="#f2d49b" />
        <circle cx="20" cy="14" r="3" fill="#d9b574" />
        <circle cx="80" cy="40" r="3" fill="#d9b574" />
        <path d="M 40 50 q 10 -6 20 0" stroke="#d9b574" strokeWidth="3" fill="none" />
      </>
    ),
  },
  grass: {
    edge: '#4f8a43',
    tile: (
      <>
        <rect width="120" height="60" fill="#7cb66a" />
        <path d="M 20 40 l 4 -12 l 4 12 M 80 20 l 4 -12 l 4 12" stroke="#5a9a4c" strokeWidth="3" fill="none" />
        <circle cx="60" cy="48" r="4" fill="#ffd166" />
      </>
    ),
  },
  snow: {
    edge: '#b9cfe4',
    tile: (
      <>
        <rect width="120" height="60" fill="#f4f8fc" />
        <path d="M 10 30 q 30 -12 60 0" stroke="#cfe0f0" strokeWidth="4" fill="none" />
      </>
    ),
  },
  asphalt: {
    edge: '#22252d',
    tile: (
      <>
        <rect width="120" height="60" fill="#3a3f4b" />
        <circle cx="30" cy="20" r="2" fill="#555c6b" />
        <circle cx="90" cy="44" r="2" fill="#555c6b" />
      </>
    ),
  },
  wood: {
    edge: '#7a4b2a',
    tile: (
      <>
        <rect width="120" height="60" fill="#c58a52" />
        <path d="M 0 0 H 120 M 0 30 H 120 M 40 0 V 30 M 100 30 V 60" stroke="#9a6534" strokeWidth="4" />
      </>
    ),
  },
  dirt: {
    edge: '#8a6236',
    tile: (
      <>
        <rect width="120" height="60" fill="#c89a63" />
        <circle cx="25" cy="18" r="4" fill="#a87b48" />
        <circle cx="85" cy="42" r="5" fill="#a87b48" />
      </>
    ),
  },
};
function Ground({ u, kind }: { u: string; kind: Floor }) {
  return (
    <>
      <defs>
        <pattern id={`${u}floor`} width="120" height="60" patternUnits="userSpaceOnUse">
          {FLOOR[kind].tile}
        </pattern>
      </defs>
      <rect x={0} y={800} width={1080} height={1120} fill={`url(#${u}floor)`} />
      <rect x={0} y={800} width={1080} height={14} fill={FLOOR[kind].edge} />
    </>
  );
}

// ---------- cảnh từng nền ----------
const BACKDROPS: ((u: string) => ReactNode)[] = [
  // 0 Phố Hội chiều
  (u) => (
    <>
      <Sky u={u} a="#ffd9a8" b="#ffeccf" />
      <circle cx={860} cy={230} r={70} fill="#ffb347" opacity={0.9} />
      <Clouds />
      <River color="#5fb3b3" wave="#d9f2f2" />
      <Bridge />
      <path d="M 170 720 Q 240 760 330 720 L 312 704 Q 240 724 188 704 Z" fill="#7b4b2a" {...ol} />
      <House x={-20} y={330} w={230} h={470} wall="#f2c14e" door="#3f6f6a" />
      <House x={230} y={390} w={150} h={410} wall="#f6d06f" door="#7a4b2a" />
      <House x={870} y={330} w={230} h={470} wall="#f2c14e" door="#7a4b2a" />
      <House x={740} y={410} w={140} h={390} wall="#efb93f" door="#3f6f6a" />
      <Ground u={u} kind="brick" />
    </>
  ),
  // 1 Phố Hội đêm
  (u) => (
    <>
      <Sky u={u} a="#141a3a" b="#3b3a6b" />
      {range(40).map((i) => (
        <circle key={i} cx={(i * 263) % 1080} cy={40 + ((i * 97) % 380)} r={i % 3 ? 2 : 3.5} fill="#fff6d0" />
      ))}
      <circle cx={850} cy={220} r={60} fill="#fff3c4" />
      <River color="#23405e" wave="#ffd27a" />
      <Bridge wall="#c9953a" lit />
      <House x={-20} y={330} w={230} h={470} wall="#c9953a" door="#2a4a48" lit />
      <House x={230} y={390} w={150} h={410} wall="#d7a64a" door="#5a3620" lit />
      <House x={870} y={330} w={230} h={470} wall="#c9953a" door="#5a3620" lit />
      <House x={740} y={410} w={140} h={390} wall="#bf8a30" door="#2a4a48" lit />
      {[300, 420, 540, 660, 780].map((x, i) => (
        <circle key={x} cx={x} cy={700 + (i % 2) * 20} r={10} fill="#ffb347" opacity={0.9} />
      ))}
      <Ground u={u} kind="brick" />
    </>
  ),
  // 2 Chợ hoa Tết
  (u) => (
    <>
      <Sky u={u} a="#ffe1e8" b="#fff3e6" />
      <Clouds fill="#fff" />
      <Tree x={150} y={420} r={110} leaf="#f9c6d3" flower="#e8508b" />
      <Tree x={930} y={420} r={110} leaf="#f9c6d3" flower="#e8508b" />
      <Tree x={540} y={470} r={80} leaf="#ffe08a" flower="#f4a261" />
      {[0, 1, 2].map((i) => {
        const x = 230 + i * 220;
        return (
          <g key={i}>
            <rect x={x} y={640} width={180} height={160} fill="#fff6e0" {...ol} />
            <path d={`M ${x - 16} 640 L ${x + 196} 640 L ${x + 180} 590 L ${x} 590 Z`} fill={i % 2 ? '#ffd166' : '#e63946'} {...ol} />
            {range(5).map((k) => (
              <circle key={k} cx={x + 24 + k * 33} cy={700} r={16} fill={['#e63946', '#ffd166', '#f15bb5', '#ff7eb3', '#f4a261'][k]} {...ol} strokeWidth={3} />
            ))}
          </g>
        );
      })}
      <path d="M 0 300 Q 540 380 1080 300" stroke="#b3261e" strokeWidth={6} fill="none" />
      {range(12).map((i) => (
        <path key={i} d={`M ${40 + i * 90} ${306 + Math.sin((i / 11) * Math.PI) * 70} l 18 40 l 18 -40 Z`} fill={i % 2 ? '#ffd166' : '#e63946'} {...ol} strokeWidth={3} />
      ))}
      <Ground u={u} kind="tile" />
    </>
  ),
  // 3 Bãi biển
  (u) => (
    <>
      <Sky u={u} a="#7ec8f2" b="#d8f1ff" h={560} />
      <circle cx={820} cy={240} r={80} fill="#ffd166" />
      <Clouds fill="#ffffff" />
      <rect x={0} y={560} width={1080} height={240} fill="#2a9d8f" />
      {range(6).map((i) => (
        <path key={i} d={`M ${-40 + (i % 3) * 380} ${600 + i * 30} q 40 -18 80 0 q 40 18 80 0`} stroke="#bdf2ec" strokeWidth={5} fill="none" />
      ))}
      <path d="M 700 600 l 60 -60 l 60 60 Z" fill="#fff" {...ol} />
      <path d="M 690 600 L 840 600 L 820 626 L 710 626 Z" fill="#e76f51" {...ol} />
      <Palm x={20} />
      <Palm x={1060} flip />
      <Ground u={u} kind="sand" />
    </>
  ),
  // 4 Đồng lúa
  (u) => (
    <>
      <Sky u={u} a="#a8dcf0" b="#eaf7ff" />
      <Clouds fill="#fff" />
      <path d="M -40 520 L 200 300 L 420 520 Z" fill="#6c9a8b" {...ol} />
      <path d="M 300 540 L 600 260 L 900 540 Z" fill="#5c8a7a" {...ol} />
      <path d="M 760 520 L 980 330 L 1140 520 Z" fill="#6c9a8b" {...ol} />
      {range(5).map((i) => (
        <path key={i} d={`M -20 ${520 + i * 56} Q 540 ${470 + i * 56} 1100 ${520 + i * 56} L 1100 ${580 + i * 56} Q 540 ${530 + i * 56} -20 ${580 + i * 56} Z`} fill={i % 2 ? '#a7c957' : '#c3dc6a'} {...ol} strokeWidth={4} />
      ))}
      <rect x={820} y={600} width={150} height={110} fill="#d4a373" {...ol} />
      <path d="M 800 610 L 895 530 L 990 610 Z" fill="#e9c46a" {...ol} />
      <Ground u={u} kind="grass" />
    </>
  ),
  // 5 Vườn hoa
  (u) => (
    <>
      <Sky u={u} a="#c9ecff" b="#f3fbff" />
      <Clouds fill="#fff" />
      <Tree x={130} y={400} r={120} leaf="#6fbf73" />
      <Tree x={950} y={400} r={120} leaf="#6fbf73" />
      <Tree x={540} y={500} r={90} leaf="#8bd17c" flower="#ffafcc" />
      <rect x={0} y={640} width={1080} height={160} fill="#8bd17c" />
      {range(18).map((i) => (
        <g key={i}>
          <circle cx={30 + i * 60} cy={690 + (i % 3) * 30} r={22} fill={['#f15bb5', '#ffd166', '#ff7eb3', '#9b5de5', '#f4a261'][i % 5]} {...ol} strokeWidth={3} />
          <circle cx={30 + i * 60} cy={690 + (i % 3) * 30} r={7} fill="#fff6d0" />
        </g>
      ))}
      <path d="M 0 780 H 1080" stroke="#fff" strokeWidth={10} />
      {range(19).map((i) => (
        <rect key={i} x={i * 60} y={740} width={16} height={60} fill="#fff" stroke={INK} strokeWidth={3} />
      ))}
      <Ground u={u} kind="grass" />
    </>
  ),
  // 6 Phố tuyết
  (u) => (
    <>
      <Sky u={u} a="#9fb7d6" b="#e6eef8" />
      <House x={-20} y={330} w={230} h={470} wall="#e8d3b0" door="#4a6a8a" roof="#6b7a8f" snow lit />
      <House x={230} y={390} w={150} h={410} wall="#d9b99b" door="#7a4b2a" roof="#6b7a8f" snow lit />
      <House x={870} y={330} w={230} h={470} wall="#e8d3b0" door="#7a4b2a" roof="#6b7a8f" snow lit />
      <House x={740} y={410} w={140} h={390} wall="#d9b99b" door="#4a6a8a" roof="#6b7a8f" snow lit />
      {[420, 540, 660].map((x, i) => (
        <g key={x}>
          <path d={`M ${x} ${520 - (i % 2) * 40} l -70 150 h 140 Z`} fill="#2d6a4f" {...ol} />
          <path d={`M ${x} ${600 - (i % 2) * 40} l -90 180 h 180 Z`} fill="#2d6a4f" {...ol} />
          <path d={`M ${x - 40} ${580 - (i % 2) * 40} q 40 -14 80 0`} stroke="#fff" strokeWidth={8} fill="none" />
        </g>
      ))}
      {range(60).map((i) => (
        <circle key={i} cx={(i * 179) % 1080} cy={(i * 131) % 800} r={i % 3 ? 4 : 7} fill="#fff" opacity={0.9} />
      ))}
      <Ground u={u} kind="snow" />
    </>
  ),
  // 7 Phố đêm neon
  (u) => (
    <>
      <Sky u={u} a="#1a0b3a" b="#4a1d6e" />
      {[
        [0, 260, 200],
        [210, 380, 150],
        [370, 220, 170],
        [550, 340, 150],
        [710, 250, 180],
        [900, 360, 200],
      ].map(([x, top, w], i) => (
        <g key={i}>
          <rect x={x} y={top} width={w} height={800 - top} fill={i % 2 ? '#2b1a52' : '#221544'} {...ol} />
          {range(Math.floor((800 - top - 40) / 50)).map((r) =>
            range(Math.floor((w - 20) / 40)).map((c) => (
              <rect key={`${r}-${c}`} x={x + 16 + c * 40} y={top + 24 + r * 50} width={20} height={26} fill={(r * 7 + c * 3 + i) % 4 ? '#ffd27a' : '#3b2a6b'} opacity={0.85} />
            )),
          )}
        </g>
      ))}
      <rect x={250} y={600} width={220} height={70} rx={14} fill="none" stroke="#ff4fd8" strokeWidth={8} />
      <rect x={640} y={560} width={200} height={70} rx={14} fill="none" stroke="#3ee8ff" strokeWidth={8} />
      <Ground u={u} kind="asphalt" />
      {range(9).map((i) => (
        <rect key={i} x={i * 130} y={1000} width={70} height={12} fill="#f4d35e" opacity={0.7} />
      ))}
    </>
  ),
  // 8 Làng tre
  (u) => (
    <>
      <Sky u={u} a="#cfe8c2" b="#f4f9e8" />
      <Clouds fill="#fff" />
      <path d="M 0 560 Q 300 460 600 540 Q 860 600 1080 520 L 1080 800 L 0 800 Z" fill="#9cc58a" {...ol} />
      {[320, 640].map((x) => (
        <g key={x}>
          <rect x={x} y={600} width={170} height={130} fill="#c89a63" {...ol} />
          <path d={`M ${x - 30} 612 L ${x + 85} 500 L ${x + 200} 612 Z`} fill="#d9b44a" {...ol} />
          <rect x={x + 60} y={650} width={50} height={80} fill="#6b4226" />
        </g>
      ))}
      {[30, 90, 150, 200, 880, 940, 1000, 1050].map((x, i) => (
        <g key={x}>
          <rect x={x} y={60 + (i % 3) * 30} width={22} height={760} fill={i % 2 ? '#5a9a4c' : '#6fae5c'} {...ol} strokeWidth={3} />
          {range(9).map((k) => (
            <path key={k} d={`M ${x} ${140 + k * 80} h 22`} stroke={INK} strokeWidth={3} />
          ))}
          <path d={`M ${x + 11} ${200 + (i % 4) * 60} q ${i % 2 ? 60 : -60} -20 ${i % 2 ? 90 : -90} 10 q ${i % 2 ? -50 : 50} 10 ${i % 2 ? -90 : 90} -10`} fill="#7cc36a" {...ol} strokeWidth={3} />
        </g>
      ))}
      <Ground u={u} kind="dirt" />
    </>
  ),
  // 9 Xưởng trong nhà
  (u) => (
    <>
      <rect width="1080" height="800" fill="#e9c9a0" />
      {range(18).map((i) => (
        <path key={i} d={`M ${i * 60} 0 V 800`} stroke="#d8b386" strokeWidth={4} />
      ))}
      <rect x={380} y={300} width={320} height={260} fill="#a8dcf0" {...ol} />
      <path d="M 540 300 V 560 M 380 430 H 700" stroke={INK} strokeWidth={8} />
      <circle cx={630} cy={360} r={30} fill="#ffd166" />
      {(
        [
          [40, 330, 150, 190, '#e76f51'],
          [220, 420, 120, 150, '#2a9d8f'],
          [780, 320, 160, 200, '#9b5de5'],
          [960, 440, 100, 140, '#ffd166'],
        ] as const
      ).map(([x, y, w, h, c], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#8b5a2b" {...ol} />
          <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} fill={c} />
          <circle cx={x + w / 2} cy={y + h / 2} r={w / 6} fill="#fff6d0" opacity={0.8} />
        </g>
      ))}
      <rect x={0} y={640} width={1080} height={22} fill="#8b5a2b" {...ol} />
      {range(10).map((i) => (
        <rect key={i} x={30 + i * 105} y={596} width={30 + (i % 3) * 10} height={44} rx={6} fill={['#e63946', '#ffd166', '#06d6a0', '#118ab2', '#f15bb5'][i % 5]} {...ol} strokeWidth={3} />
      ))}
      <Ground u={u} kind="wood" />
    </>
  ),
];

/** Nền theo `bg` + dây đèn lồng + giá vẽ. Vẽ lại chỉ khi đổi nền (memo). */
export const Scene = memo(function Scene({ bg }: { bg: number }) {
  const u = 's' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const draw = BACKDROPS[bg] ?? BACKDROPS[0];
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} className="absolute inset-0">
      {draw(u)}

      {/* dây đèn lồng phía trước */}
      <path d="M -10 120 Q 540 210 1090 120" stroke={INK} strokeWidth={4} fill="none" />
      {(
        [
          [90, 138, '#e63946'],
          [250, 160, '#f4a261'],
          [830, 160, '#2a9d8f'],
          [990, 138, '#f4a261'],
        ] as const
      ).map(([x, y, c]) => (
        <Lantern key={x} x={x} y={y} c={c} s={0.8} />
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
