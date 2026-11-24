import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState, Waiting } from './useGame';
import { GAME, TEXT } from './config';
import { Scene } from './Scene';
import { Easel } from './Easel';
import { Painter } from './Painter';
import { STYLES } from './portrait';
import { CANVAS, QUEUE, STRING_Y, type Brush } from './layout';

const INK = '#2a1d17';

// Dây treo tranh: đường cong võng giữa
const stringY = (x: number) => {
  const t = x / 1080;
  return (1 - t) ** 2 * (STRING_Y - 10) + 2 * (1 - t) * t * (STRING_Y + 60) + t ** 2 * (STRING_Y - 10);
};
const FRAME_W = 140;
const slotX = (i: number) => 46 + i * 158;

/** Màn hình live 1080x1920 */
export function GameStage({ game }: { game: GameState }) {
  const brush = useRef<Brush>({ x: 0, y: 0, mode: 'idle', color: '#3b2a20' }).current;
  const likePct = Math.min(100, (game.likeProgress / GAME.likesPerBoost) * 100);
  const job = game.job;
  const T = TEXT[game.lang];

  return (
    <div className={`relative h-full w-full overflow-hidden ${game.boosting ? 'stage-boost' : ''}`}>
      <Scene bg={game.bg} />

      {/* Biển hiệu */}
      <div
        className="absolute left-1/2 top-[146px] -translate-x-1/2 rounded-[22px] border-[6px] px-12 py-3 text-center shadow-xl"
        style={{ background: '#7a4b2a', borderColor: INK }}
      >
        <div className="whitespace-nowrap text-[60px] font-extrabold leading-none tracking-wide text-[#ffe8a3]">{T.title}</div>
      </div>

      {/* Dây treo tranh vừa vẽ xong */}
      <svg className="absolute inset-0" width={1080} height={700} viewBox="0 0 1080 700">
        <path d={`M -10 ${STRING_Y - 12} Q 540 ${STRING_Y + 130} 1090 ${STRING_Y - 12}`} stroke={INK} strokeWidth={5} fill="none" />
      </svg>
      {game.gallery.length === 0 &&
        [1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center rounded-lg border-4 border-dashed border-[#7a4b2a]/60 bg-white/40 text-center text-[24px] font-semibold text-[#7a4b2a]"
            style={{ left: slotX(i + 1), top: stringY(slotX(i + 1) + FRAME_W / 2) + 14, width: FRAME_W, height: FRAME_W }}
          >
            {T.hangHere}
          </div>
        ))}
      <AnimatePresence>
        {game.gallery.map((g, i) => {
          const x = slotX(i);
          const y = stringY(x + FRAME_W / 2);
          return (
            <motion.div
              key={g.id}
              className="absolute left-0 top-0"
              initial={{ x: CANVAS.x + 120, y: CANVAS.y + 60, scale: 2.4, opacity: 0.4 }}
              animate={{ x, y, scale: 1, opacity: 1 }}
              exit={{ y: y + 500, rotate: 25, opacity: 0, transition: { duration: 0.7, ease: [0.55, 0, 1, 0.45] } }}
              transition={{ type: 'spring', stiffness: 120, damping: 17 }}
              style={{ width: FRAME_W }}
            >
              <div className="swing" style={{ animationDelay: `${-i * 0.7}s` }}>
                <div className="mx-auto h-5 w-4 rounded-sm bg-[#c9a24a]" style={{ border: `3px solid ${INK}` }} />
                <div
                  className="-mt-1 rounded-md p-[6px] shadow-lg"
                  style={{ background: g.vip ? 'linear-gradient(135deg,#ffe082,#f4b400,#ffe082)' : '#8b5a2b', border: `4px solid ${INK}` }}
                >
                  <img src={g.img} className="block h-[116px] w-[116px] rounded-sm" />
                </div>
                <div className="mt-1 truncate rounded-full bg-white/90 px-2 text-center text-[22px] font-bold text-[#2a1d17]">
                  {g.vip && '⭐ '}
                  {g.name}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Khu xếp hàng */}
      <Queue queue={game.queue} T={T} />

      {/* Giá vẽ + họa sĩ */}
      <Easel job={job} brush={brush} lang={game.lang} onDone={game.finish} />
      <AnimatePresence>
        <motion.div
          key={game.painter.name}
          className="absolute inset-0"
          initial={{ x: -520 }}
          animate={{ x: 0 }}
          exit={{ x: -620 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Painter p={game.painter} brush={brush} lines={T.show} label={`${T.painter} ${game.lang === 'en' ? game.painter.en : game.painter.name}`} />
        </motion.div>
      </AnimatePresence>

      {/* Bảng tên dưới tranh */}
      <AnimatePresence mode="wait">
        {job && (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute flex flex-col items-center"
            style={{ left: CANVAS.x - 30, top: CANVAS.y + CANVAS.size + 54, width: CANVAS.size + 60 }}
          >
            <div
              className="max-w-full truncate rounded-2xl px-6 py-2 text-[38px] font-extrabold"
              style={{ background: job.vip ? '#f4b400' : '#fff7e6', color: INK, border: `5px solid ${INK}` }}
            >
              {job.vip && '⭐ '}
              {job.name}
            </div>
            <div className="mt-2 rounded-full bg-[#2a1d17]/80 px-5 py-1 text-[28px] font-semibold text-amber-100">
              {T.style}: {game.lang === 'en' ? STYLES[job.style].en : STYLES[job.style].name}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gợi ý + thanh tim */}
      <div className="absolute left-1/2 top-[1520px] -translate-x-1/2 whitespace-nowrap rounded-full border-[5px] bg-[#fff7e6] px-9 py-3 text-[38px] font-bold text-[#2a1d17] shadow-lg" style={{ borderColor: INK }}>
        💬 Comment <span className="text-[#c0392b]">“{T.keyword}”</span>
      </div>
      <div className="absolute left-[60px] right-[160px] top-[1610px]">
        <div className="mb-1 flex justify-between text-[28px] font-bold text-white drop-shadow">
          <span>❤️ {T.likes}</span>
          <span>
            {game.likeProgress}/{GAME.likesPerBoost}
          </span>
        </div>
        <div className="h-5 overflow-hidden rounded-full border-[3px] bg-white/40" style={{ borderColor: INK }}>
          <div className="h-full rounded-full bg-[#e63946] transition-[width] duration-500" style={{ width: `${likePct}%` }} />
        </div>
      </div>
    </div>
  );
}

const SLOTS = QUEUE.cols * QUEUE.rows;
// Người đầu hàng đứng góc trên bên phải (sát họa sĩ), hàng đi zíc zắc xuống dưới
const slotPos = (i: number) => {
  const r = Math.floor(i / QUEUE.cols);
  const k = i % QUEUE.cols;
  const c = r % 2 === 0 ? QUEUE.cols - 1 - k : k;
  return { x: QUEUE.x + c * QUEUE.gap, y: QUEUE.y + r * QUEUE.gap };
};

function Queue({ queue, T }: { queue: Waiting[]; T: (typeof TEXT)['vi'] }) {
  const shown = queue.slice(0, SLOTS);
  const more = queue.length - shown.length;
  const W = QUEUE.cols * QUEUE.gap;
  return (
    <>
      <div className="absolute rounded-full border-[4px] bg-[#fff7e6] px-5 py-1 text-[30px] font-extrabold text-[#2a1d17]" style={{ left: QUEUE.x, top: QUEUE.y - 66, borderColor: INK }}>
        {T.queue} · {queue.length}
      </div>
      {/* cột + dây nhung */}
      <svg className="absolute left-0 top-0" width={1080} height={1920}>
        {Array.from({ length: QUEUE.rows - 1 }, (_, r) => {
          const y = QUEUE.y + r * QUEUE.gap + QUEUE.gap - 6;
          const open = r % 2 === 0; // chừa lối đi ở bên trái / phải xen kẽ
          const x1 = QUEUE.x + (open ? 6 : QUEUE.gap);
          const x2 = QUEUE.x + W - (open ? QUEUE.gap : 6);
          return (
            <g key={r}>
              <path d={`M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + 14} ${x2} ${y}`} stroke="#b3261e" strokeWidth={7} fill="none" />
              {[x1, x2].map((x) => (
                <g key={x}>
                  <rect x={x - 4} y={y - 20} width={8} height={40} fill="#c9a24a" stroke={INK} strokeWidth={2} />
                  <circle cx={x} cy={y - 22} r={7} fill="#e0bb55" stroke={INK} strokeWidth={2} />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <AnimatePresence>
        {shown.map((w, i) => {
          const p = slotPos(i);
          return (
            <motion.div
              key={w.username}
              className="absolute left-0 top-0"
              initial={{ x: p.x, y: p.y + 30, scale: 0, opacity: 0 }}
              animate={{ x: p.x, y: p.y, scale: 1, opacity: 1 }}
              exit={{ x: 380, y: QUEUE.y + 120, scale: 0.4, opacity: 0, transition: { duration: 0.45, ease: 'easeIn' } }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <Person w={w} />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {/* 1 nhãn "Kế tiếp" cố định ở chỗ đứng đầu hàng */}
      {shown.length > 0 && (
        <div
          className="absolute -translate-x-1/2 whitespace-nowrap rounded bg-[#c0392b] px-2 text-[20px] font-bold text-white"
          style={{ left: slotPos(0).x + 32, top: slotPos(0).y - 36 }}
        >
          {T.next}
        </div>
      )}
      {more > 0 && (
        <div className="absolute rounded-full bg-[#2a1d17]/85 px-4 py-1 text-[28px] font-bold text-white" style={{ left: QUEUE.x + 40, top: QUEUE.y + QUEUE.rows * QUEUE.gap + 4 }}>
          {T.more(more)}
        </div>
      )}
    </>
  );
}

const DOT = ['#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#9b5de5', '#f15bb5', '#00bbf9'];
function Person({ w }: { w: Waiting }) {
  const color = DOT[[...w.username].reduce((s, c) => s + c.charCodeAt(0), 0) % DOT.length];
  return (
    <div className="relative h-[64px] w-[64px] bob" style={{ animationDelay: `${-(w.username.length % 7) * 0.3}s` }}>
      <div
        className="h-[58px] w-[58px] overflow-hidden rounded-full"
        style={{ border: `4px solid ${w.vip ? '#f4b400' : INK}`, background: color, boxShadow: w.vip ? '0 0 16px 4px rgba(244,180,0,0.8)' : undefined }}
      >
        {w.avatar ? (
          <img src={w.avatar} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[28px] font-extrabold text-white">{[...w.name][0]?.toUpperCase()}</div>
        )}
      </div>
      {w.vip && <div className="absolute -right-2 -top-3 text-[28px]">⭐</div>}
    </div>
  );
}
