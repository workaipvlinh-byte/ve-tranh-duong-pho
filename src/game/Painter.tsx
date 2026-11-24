import { useEffect, useRef } from 'react';
import { PAINTER, type Brush } from './layout';

// 10 họa sĩ, kiểu búp bê đầu tròn, viền mực dày (theo nét của skill ve-tranh-2d). Quay mặt sang phải (về giá vẽ).
type HairStyle = 'short' | 'bob' | 'bun' | 'long' | 'curly' | 'pony' | 'spiky' | 'bald';
type Hat = 'beret' | 'nonla' | 'cap' | 'khanxep' | 'straw' | 'bandana' | 'beanie';
export interface PainterDef {
  name: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  hat?: Hat;
  hatColor?: string;
  shirt: string;
  pants: string;
  skirt?: boolean;
  apron?: string;
  glasses?: boolean;
  mustache?: boolean;
  beard?: 'short' | 'long';
  blush?: boolean;
}

export const PAINTERS: PainterDef[] = [
  { name: 'Chú Tư', skin: '#d9a27c', hair: '#2b1d16', hairStyle: 'short', hat: 'nonla', hatColor: '#ecd28f', shirt: '#8b5a2b', pants: '#2d2a26', mustache: true },
  { name: 'Cô Mây', skin: '#f6d2b8', hair: '#2b1d16', hairStyle: 'long', hat: 'beret', hatColor: '#2f9e6e', shirt: '#fdfdfd', pants: '#2a6f97', skirt: true, apron: '#9ad1b6', blush: true },
  { name: 'Bé Bin', skin: '#eec19f', hair: '#4a2f22', hairStyle: 'spiky', hat: 'cap', hatColor: '#f77f00', shirt: '#3a86ff', pants: '#22333b' },
  { name: 'Bà Sáu', skin: '#eec19f', hair: '#d9d9d9', hairStyle: 'bun', shirt: '#7b4fa0', pants: '#3d2c4e', skirt: true, apron: '#ead7f7', glasses: true },
  { name: 'Anh Khoa', skin: '#b97d57', hair: '#1c1c2e', hairStyle: 'curly', hat: 'bandana', hatColor: '#d62828', shirt: '#2b2d42', pants: '#6c584c', beard: 'short' },
  { name: 'Chị Hồng', skin: '#f6d2b8', hair: '#9b3b5a', hairStyle: 'pony', shirt: '#ffafcc', pants: '#ff5d8f', skirt: true, blush: true },
  { name: 'Ông Đồ', skin: '#eec19f', hair: '#eeeeee', hairStyle: 'bald', hat: 'khanxep', hatColor: '#14385c', shirt: '#1d4e89', pants: '#efefef', beard: 'long', mustache: true },
  { name: 'Cậu Tí', skin: '#f6d2b8', hair: '#c58b3a', hairStyle: 'short', hat: 'beanie', hatColor: '#4361ee', shirt: '#ffd60a', pants: '#264653', glasses: true },
  { name: 'Cô Thủy', skin: '#d9a27c', hair: '#7a4a2a', hairStyle: 'curly', hat: 'straw', hatColor: '#e9c46a', shirt: '#e63946', pants: '#264653', skirt: true, blush: true },
  { name: 'Anh Bảo', skin: '#eec19f', hair: '#2b1d16', hairStyle: 'bob', hat: 'beret', hatColor: '#3d405b', shirt: '#606c38', pants: '#283618', apron: '#f4a261', mustache: true },
];

const SHOW_LINES = ['Đẹp chưa nè!', 'Xong rồi nha!', 'Ưng không bạn?', 'Tuyệt tác!', 'Treo lên thôi!', 'Hết sẩy!', 'Giống y chang!'];

const INK = '#2a1d17';
const SW = 6; // viền mực
const HEAD = { x: 172, y: 150, r: 74 };
const SHOULDER = { x: 226, y: 288 };
const L1 = 138;
const L2 = 132;
const BRUSH_LEN = 58;

const ol = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function HairBack({ p }: { p: PainterDef }) {
  if (p.hairStyle === 'long') return <path d="M 96 120 Q 80 230 100 300 L 168 300 Q 150 220 160 120 Z" fill={p.hair} {...ol} />;
  if (p.hairStyle === 'pony') return <path d="M 104 118 Q 40 150 58 250 Q 70 280 90 268 Q 74 200 120 150 Z" fill={p.hair} {...ol} />;
  if (p.hairStyle === 'bun') return <circle cx={112} cy={86} r={30} fill={p.hair} {...ol} />;
  return null;
}

function HairFront({ p }: { p: PainterDef }) {
  const f = { fill: p.hair, ...ol };
  switch (p.hairStyle) {
    case 'short':
    case 'pony':
    case 'bun':
      return <path d="M 100 168 Q 92 72 176 70 Q 250 72 250 132 Q 214 104 170 112 Q 128 120 116 172 Z" {...f} />;
    case 'bob':
    case 'long':
      return <path d="M 98 212 Q 82 70 176 68 Q 254 70 250 136 Q 212 100 166 110 Q 132 122 134 210 Z" {...f} />;
    case 'curly':
      return (
        <g {...f}>
          {[150, 175, 200, 225, 250, 275, 300, 325, 350].map((a, i) => {
            const r = (a * Math.PI) / 180;
            return <circle key={i} cx={HEAD.x + Math.cos(r) * 70} cy={HEAD.y - 8 + Math.sin(r) * 70} r={24} />;
          })}
          <circle cx={112} cy={175} r={22} />
        </g>
      );
    case 'spiky':
      return <path d="M 100 165 L 96 110 L 118 118 L 116 74 L 146 96 L 160 58 L 182 92 L 206 60 L 216 98 L 246 84 L 238 120 L 252 132 Q 212 106 168 114 Q 130 122 116 170 Z" {...f} />;
    case 'bald':
      return <path d="M 100 170 Q 96 130 112 118 Q 120 150 118 180 Z" {...f} />;
  }
}

function HatShape({ p }: { p: PainterDef }) {
  const c = p.hatColor ?? '#c0392b';
  const f = { fill: c, ...ol };
  switch (p.hat) {
    case 'beret':
      return (
        <g>
          <ellipse cx={160} cy={84} rx={88} ry={30} transform="rotate(-10 160 84)" {...f} />
          <path d="M 156 54 l 4 -14" {...ol} />
        </g>
      );
    case 'nonla':
      return (
        <g>
          <path d="M 52 108 L 176 18 L 300 108 Q 176 130 52 108 Z" {...f} />
          <path d="M 110 104 L 176 30 M 150 112 L 176 30 M 202 112 L 176 30 M 242 106 L 176 30" stroke="#b8975a" strokeWidth={3} fill="none" />
          <path d="M 120 116 Q 140 240 200 222" stroke="#7a5b2e" strokeWidth={3} fill="none" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M 100 118 Q 104 52 176 52 Q 248 56 250 116 Z" {...f} />
          <path d="M 240 110 Q 300 104 320 122 Q 276 130 240 124 Z" {...f} />
          <circle cx={176} cy={54} r={6} fill={INK} />
        </g>
      );
    case 'khanxep':
      return (
        <g>
          <ellipse cx={172} cy={92} rx={84} ry={36} {...f} />
          <path d="M 96 92 Q 172 70 248 92 M 100 104 Q 172 82 244 104" stroke="#2c6aa8" strokeWidth={5} fill="none" />
        </g>
      );
    case 'straw':
      return (
        <g>
          <ellipse cx={172} cy={100} rx={138} ry={28} {...f} />
          <path d="M 114 100 Q 116 38 172 38 Q 230 38 232 100 Z" {...f} />
          <path d="M 116 88 Q 172 80 230 88 L 231 100 Q 172 92 115 100 Z" fill="#c0392b" stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'bandana':
      return (
        <g>
          <path d="M 98 116 Q 176 82 252 116 L 250 136 Q 176 106 100 138 Z" {...f} />
          <path d="M 100 124 L 70 112 L 76 140 Z" {...f} />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M 98 122 Q 100 40 176 40 Q 252 40 252 122 Z" {...f} />
          <rect x={94} y={104} width={162} height={28} rx={12} {...f} />
          <circle cx={176} cy={34} r={16} fill="#fff" {...ol} />
        </g>
      );
    default:
      return null;
  }
}

/** 1 họa sĩ. Mọi chuyển động chạy bằng requestAnimationFrame, đổi thẳng thuộc tính SVG (không render lại React). */
export function Painter({ p, brush }: { p: PainterDef; brush: Brush }) {
  const root = useRef<SVGGElement>(null);
  const head = useRef<SVGGElement>(null);
  const upper = useRef<SVGPathElement>(null);
  const upperIn = useRef<SVGPathElement>(null);
  const fore = useRef<SVGPathElement>(null);
  const foreIn = useRef<SVGPathElement>(null);
  const hand = useRef<SVGCircleElement>(null);
  const stick = useRef<SVGLineElement>(null);
  const tip = useRef<SVGCircleElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const mouthOpen = useRef<SVGPathElement>(null);
  const mouthSmile = useRef<SVGPathElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const palette = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    const s = { hx: 280, hy: 420, lean: 0, lift: 0, nextBlink: performance.now() + 2000, lastMode: '' };
    const frame = (now: number) => {
      const t = now / 1000;
      const drawing = brush.mode === 'line' || brush.mode === 'color';
      // đầu cọ muốn tới đâu (toạ độ trong hộp họa sĩ)
      let tx: number;
      let ty: number;
      if (drawing) {
        tx = brush.x - PAINTER.x;
        ty = brush.y - PAINTER.y;
      } else if (brush.mode === 'show') {
        tx = 370 + Math.sin(t * 6) * 12; // giơ cọ khoe tranh
        ty = 120 + Math.cos(t * 6) * 8;
      } else {
        tx = 318 + Math.sin(t * 1.3) * 10; // đứng chờ, cọ đung đưa
        ty = 470 + Math.sin(t * 2.1) * 8;
      }

      // nghiêng người / kiễng chân cho tay với tới
      const leanT = drawing ? Math.max(-10, Math.min(70, (tx - (SHOULDER.x + 190)) * 0.45)) : 0;
      const liftT = drawing ? Math.max(0, Math.min(34, (SHOULDER.y - 150 - ty) * 0.22)) : brush.mode === 'show' ? 10 : 0;
      s.lean += (leanT - s.lean) * 0.08;
      s.lift += (liftT - s.lift) * 0.08;
      const bob = Math.sin(t * 2.4) * 3 + (drawing ? Math.sin(t * 22) * 1.2 : 0);
      const ox = s.lean;
      const oy = bob - s.lift;
      root.current?.setAttribute('transform', `translate(${ox.toFixed(1)} ${oy.toFixed(1)})`);

      // tay: cọ chĩa từ vai về đích, bàn tay lùi lại 1 đoạn cán cọ
      const lx = tx - ox;
      const ly = ty - oy;
      let dx = lx - SHOULDER.x;
      let dy = ly - SHOULDER.y;
      const dl = Math.hypot(dx, dy) || 1;
      const ux = dx / dl;
      const uy = dy / dl;
      const hxT = lx - ux * BRUSH_LEN;
      const hyT = ly - uy * BRUSH_LEN;
      const follow = drawing ? 0.42 : 0.12;
      s.hx += (hxT - s.hx) * follow;
      s.hy += (hyT - s.hy) * follow;

      dx = s.hx - SHOULDER.x;
      dy = s.hy - SHOULDER.y;
      const d = Math.min(L1 + L2 - 1, Math.max(30, Math.hypot(dx, dy)));
      const a = Math.atan2(dy, dx);
      const alpha = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
      const ex = SHOULDER.x + Math.cos(a + alpha) * L1;
      const ey = SHOULDER.y + Math.sin(a + alpha) * L1;
      const hx = SHOULDER.x + Math.cos(a) * d;
      const hy = SHOULDER.y + Math.sin(a) * d;
      const up = `M ${SHOULDER.x} ${SHOULDER.y} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const fo = `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${hx.toFixed(1)} ${hy.toFixed(1)}`;
      upper.current?.setAttribute('d', up);
      upperIn.current?.setAttribute('d', up);
      fore.current?.setAttribute('d', fo);
      foreIn.current?.setAttribute('d', fo);
      hand.current?.setAttribute('cx', hx.toFixed(1));
      hand.current?.setAttribute('cy', hy.toFixed(1));
      const bx = hx + ux * BRUSH_LEN;
      const by = hy + uy * BRUSH_LEN;
      stick.current?.setAttribute('x1', hx.toFixed(1));
      stick.current?.setAttribute('y1', hy.toFixed(1));
      stick.current?.setAttribute('x2', bx.toFixed(1));
      stick.current?.setAttribute('y2', by.toFixed(1));
      tip.current?.setAttribute('cx', bx.toFixed(1));
      tip.current?.setAttribute('cy', by.toFixed(1));
      tip.current?.setAttribute('fill', brush.mode === 'color' ? brush.color : '#3b2a20');

      // đầu nghiêng theo cọ, mắt chớp
      const tilt = drawing ? Math.max(-9, Math.min(9, (ly - HEAD.y) * 0.03)) : Math.sin(t * 0.9) * 3;
      head.current?.setAttribute('transform', `rotate(${tilt.toFixed(1)} ${HEAD.x} ${HEAD.y + 70})`);
      let blink = 1;
      if (now > s.nextBlink) {
        const k = (now - s.nextBlink) / 140;
        if (k >= 1) s.nextBlink = now + 2200 + Math.random() * 2600;
        else blink = Math.abs(1 - 2 * k) * 0.9 + 0.1;
      }
      const look = drawing ? Math.max(-4, Math.min(6, (ly - HEAD.y) * 0.02)) : 0;
      eyes.current?.setAttribute('transform', `translate(3 ${look.toFixed(1)}) translate(0 148) scale(1 ${blink.toFixed(2)}) translate(0 -148)`);
      palette.current?.setAttribute('transform', `rotate(${(Math.sin(t * 1.7) * 3).toFixed(1)} 104 400)`);

      // khoe tranh: há miệng cười + bong bóng lời
      if (brush.mode !== s.lastMode) {
        const show = brush.mode === 'show';
        mouthOpen.current?.setAttribute('visibility', show ? 'visible' : 'hidden');
        mouthSmile.current?.setAttribute('visibility', show ? 'hidden' : 'visible');
        if (bubble.current) {
          if (show) bubble.current.textContent = SHOW_LINES[Math.floor(Math.random() * SHOW_LINES.length)];
          bubble.current.style.opacity = show ? '1' : '0';
          bubble.current.style.transform = show ? 'scale(1)' : 'scale(0.6)';
        }
        s.lastMode = brush.mode;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [brush]);

  const eye = (cx: number, cy: number) => <ellipse cx={cx} cy={cy} rx={7} ry={10} fill={INK} />;

  return (
    <div className="absolute" style={{ left: PAINTER.x, top: PAINTER.y, width: PAINTER.w, height: PAINTER.h }}>
      <svg viewBox={`0 0 ${PAINTER.w} ${PAINTER.h}`} width={PAINTER.w} height={PAINTER.h} overflow="visible">
        {/* bóng dưới chân */}
        <ellipse cx={180} cy={676} rx={110} ry={16} fill="rgba(60,30,10,0.22)" />
        <g ref={root}>
          {/* tay sau cầm bảng màu */}
          <path d="M 120 286 L 92 370 L 112 404" fill="none" stroke={INK} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 120 286 L 92 370 L 112 404" fill="none" stroke={p.shirt} strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
          <g ref={palette}>
            <path d="M 50 392 Q 60 350 120 362 Q 170 372 160 410 Q 150 440 100 432 Q 82 428 90 414 Q 98 402 80 404 Q 44 410 50 392 Z" fill="#d9a066" {...ol} />
            <circle cx={84} cy={382} r={8} fill="#e63946" />
            <circle cx={110} cy={376} r={8} fill="#ffd166" />
            <circle cx={136} cy={386} r={8} fill="#06d6a0" />
            <circle cx={138} cy={412} r={8} fill="#118ab2" />
          </g>
          <circle cx={112} cy={404} r={15} fill={p.skin} {...ol} />

          {/* chân */}
          {p.skirt ? (
            <g>
              <path d="M 140 520 L 140 652 M 200 520 L 200 652" stroke={INK} strokeWidth={26} strokeLinecap="round" />
              <path d="M 140 520 L 140 652 M 200 520 L 200 652" stroke={p.skin} strokeWidth={14} strokeLinecap="round" />
              <path d="M 104 440 L 244 440 L 268 566 Q 172 586 82 566 Z" fill={p.pants} {...ol} />
            </g>
          ) : (
            <g>
              <path d="M 120 460 L 128 650 L 166 650 L 172 470 Z" fill={p.pants} {...ol} />
              <path d="M 176 470 L 184 650 L 222 650 L 232 460 Z" fill={p.pants} {...ol} />
            </g>
          )}
          <ellipse cx={146} cy={662} rx={32} ry={14} fill="#3b2a20" {...ol} />
          <ellipse cx={210} cy={662} rx={32} ry={14} fill="#3b2a20" {...ol} />

          {/* thân */}
          <path d="M 110 266 Q 172 238 234 266 L 250 474 Q 172 494 94 474 Z" fill={p.shirt} {...ol} />
          <path d="M 110 266 Q 120 380 112 476 L 94 474 Z" fill="rgba(0,0,0,0.12)" />
          {p.apron && (
            <g>
              <path d="M 128 330 L 228 330 L 242 486 Q 180 498 118 486 Z" fill={p.apron} {...ol} />
              <rect x={152} y={396} width={56} height={40} rx={8} fill="rgba(0,0,0,0.08)" stroke={INK} strokeWidth={3} />
              <circle cx={168} cy={360} r={5} fill="#e63946" />
              <circle cx={204} cy={452} r={6} fill="#118ab2" />
            </g>
          )}

          {/* đầu */}
          <g ref={head}>
            <HairBack p={p} />
            <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={p.skin} {...ol} />
            <circle cx={112} cy={162} r={15} fill={p.skin} {...ol} />
            {p.beard && (
              <path
                d={p.beard === 'long' ? 'M 128 196 Q 150 330 220 300 Q 250 250 244 196 Q 200 230 128 196 Z' : 'M 112 168 Q 120 236 186 232 Q 238 228 246 190 Q 220 214 180 212 Q 132 210 112 168 Z'}
                fill={p.hair}
                {...ol}
              />
            )}
            <g ref={eyes}>
              {eye(200, 148)}
              {eye(236, 146)}
            </g>
            <path d="M 188 124 q 12 -8 24 -2 M 228 122 q 10 -6 20 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            <path d="M 244 160 q 14 8 2 18" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
            {p.blush && (
              <g fill="rgba(255,100,110,0.35)">
                <ellipse cx={192} cy={178} rx={12} ry={7} />
                <ellipse cx={244} cy={180} rx={9} ry={6} />
              </g>
            )}
            <path ref={mouthSmile} d="M 206 196 Q 222 210 238 196" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
            <path ref={mouthOpen} visibility="hidden" d="M 204 192 Q 222 228 242 192 Z" fill="#8a2c2c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            {p.mustache && <path d="M 206 186 Q 222 176 240 186 Q 230 196 222 190 Q 214 196 206 186 Z" fill={p.beard === 'long' ? p.hair : '#2b1d16'} stroke={INK} strokeWidth={3} />}
            {p.glasses && (
              <g fill="rgba(255,255,255,0.25)" stroke={INK} strokeWidth={4}>
                <circle cx={200} cy={148} r={17} />
                <circle cx={238} cy={146} r={15} />
                <path d="M 217 147 L 223 147 M 183 146 L 118 150" fill="none" />
              </g>
            )}
            <HairFront p={p} />
            <HatShape p={p} />
          </g>

          {/* tay cầm cọ */}
          <path ref={upper} fill="none" stroke={INK} strokeWidth={40} strokeLinecap="round" />
          <path ref={upperIn} fill="none" stroke={p.shirt} strokeWidth={28} strokeLinecap="round" />
          <path ref={fore} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <path ref={foreIn} fill="none" stroke={p.skin} strokeWidth={18} strokeLinecap="round" />
          <line ref={stick} stroke="#8b5a2b" strokeWidth={8} strokeLinecap="round" />
          <circle ref={hand} r={16} fill={p.skin} {...ol} />
          <circle ref={tip} r={9} fill="#3b2a20" stroke={INK} strokeWidth={3} />
        </g>
      </svg>

      <div
        ref={bubble}
        className="absolute left-[150px] top-[-70px] whitespace-nowrap rounded-[28px] border-[5px] border-[#2a1d17] bg-white px-7 py-3 text-[40px] font-extrabold text-[#2a1d17] shadow-lg"
        style={{ opacity: 0, transform: 'scale(0.6)', transformOrigin: 'bottom left', transition: 'opacity 180ms ease-out, transform 260ms cubic-bezier(.34,1.56,.64,1)' }}
      />
      <div className="absolute left-[60px] top-[690px] rounded-full bg-[#2a1d17]/80 px-5 py-1 text-[28px] font-semibold text-amber-100">
        Họa sĩ {p.name}
      </div>
    </div>
  );
}
