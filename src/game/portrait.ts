// Bộ vẽ chân dung: từ ảnh avatar (hoặc mặt hoạt hình tự sinh) ra 2 lớp
//   - nét (danh sách đường, vẽ dần từng đoạn)
//   - màu (tranh hoàn chỉnh theo 1 trong 10 phong cách, lộ dần theo vệt cọ)
// Toàn bộ vẽ bằng canvas, không dùng ảnh ngoài.

export const ART = 560; // cỡ tranh (điểm ảnh trong canvas)
const SRC = 96; // cỡ ảnh nguồn đem dò nét

export interface Style {
  key: string;
  name: string;
  en: string; // tên phong cách ở bản tiếng Anh
  ink: string; // màu nét phác
  lineW: number;
  linesOnTop: boolean; // nét còn hiện trên lớp màu hay bị màu phủ
  paper: string;
  build: (src: HTMLCanvasElement, rnd: () => number) => HTMLCanvasElement;
}

// ---------- tiện ích ----------
export function seeded(text: string) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
  let a = (h << 13) | (h >>> 19);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mk = (w: number, h = w) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const ctx2 = (c: HTMLCanvasElement) => c.getContext('2d', { willReadFrequently: true })!;

/** Ảnh nguồn thu về cỡ R, trả dữ liệu điểm ảnh (đã làm mượt) */
function pixels(src: HTMLCanvasElement, R: number) {
  const c = mk(R);
  const g = ctx2(c);
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, R, R);
  return g.getImageData(0, 0, R, R);
}
const lum = (d: Uint8ClampedArray, i: number) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
const clamp = (v: number, a = 0, b = 255) => (v < a ? a : v > b ? b : v);
const rgb = (r: number, g: number, b: number, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;

function sampler(src: HTMLCanvasElement, R = 140) {
  const img = pixels(src, R);
  return (u: number, v: number) => {
    const x = clamp(Math.floor(u * R), 0, R - 1);
    const y = clamp(Math.floor(v * R), 0, R - 1);
    const i = (y * R + x) * 4;
    return [img.data[i], img.data[i + 1], img.data[i + 2]] as const;
  };
}

function saturate([r, g, b]: readonly number[], k: number) {
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  return [clamp(l + (r - l) * k), clamp(l + (g - l) * k), clamp(l + (b - l) * k)];
}

function paper(c: HTMLCanvasElement, color: string, rnd: () => number, grain = 900) {
  const g = ctx2(c);
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < grain; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.06)';
    g.fillRect(rnd() * c.width, rnd() * c.height, 2, 2);
  }
  return g;
}

/** Áp dữ liệu điểm ảnh cỡ R lên tranh ART (phóng mượt) */
function upscale(img: ImageData, smooth = true) {
  const small = mk(img.width);
  ctx2(small).putImageData(img, 0, 0);
  const out = mk(ART);
  const g = ctx2(out);
  g.imageSmoothingEnabled = smooth;
  g.drawImage(small, 0, 0, ART, ART);
  return out;
}

// ---------- 10 phong cách ----------
export const STYLES: Style[] = [
  {
    key: 'mosaic',
    name: 'Khảm gốm',
    en: 'Mosaic',
    ink: '#4a3426',
    lineW: 3,
    linesOnTop: false,
    paper: '#efe4d0',
    build(src, rnd) {
      const T = 30;
      const s = ART / T;
      const at = sampler(src);
      const c = mk(ART);
      const g = paper(c, '#e9dcc4', rnd, 0);
      for (let y = 0; y < T; y++)
        for (let x = 0; x < T; x++) {
          const [r, gg, b] = saturate(at((x + 0.5) / T, (y + 0.5) / T), 1.25);
          const j = (rnd() - 0.5) * 26;
          g.fillStyle = rgb(r + j, gg + j, b + j);
          const inset = 1.6 + rnd() * 0.8;
          g.beginPath();
          g.roundRect(x * s + inset, y * s + inset, s - inset * 2, s - inset * 2, 3);
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.22)';
          g.fillRect(x * s + inset + 2, y * s + inset + 2, s * 0.35, s * 0.18);
        }
      return c;
    },
  },
  {
    key: 'pixel',
    name: 'Điểm ảnh',
    en: 'Pixel art',
    ink: '#222',
    lineW: 3,
    linesOnTop: false,
    paper: '#f4f1ea',
    build(src) {
      const img = pixels(src, 28);
      const d = img.data;
      const q = (v: number) => Math.round(v / 51) * 51;
      for (let i = 0; i < d.length; i += 4) {
        const [r, g, b] = saturate([d[i], d[i + 1], d[i + 2]], 1.3);
        d[i] = q(r);
        d[i + 1] = q(g);
        d[i + 2] = q(b);
      }
      return upscale(img, false);
    },
  },
  {
    key: 'watercolor',
    name: 'Màu nước',
    en: 'Watercolor',
    ink: '#5b4b3f',
    lineW: 2,
    linesOnTop: true,
    paper: '#fbf6ec',
    build(src, rnd) {
      const c = mk(ART);
      const g = paper(c, '#fbf6ec', rnd);
      g.globalAlpha = 0.8;
      g.filter = 'blur(7px) saturate(1.4) brightness(1.08)';
      g.drawImage(src, 14, 14, ART - 28, ART - 28);
      g.filter = 'none';
      const at = sampler(src);
      for (let i = 0; i < 380; i++) {
        const u = rnd();
        const v = rnd();
        const [r, gg, b] = saturate(at(u, v), 1.5);
        g.globalAlpha = 0.18 + rnd() * 0.15;
        g.fillStyle = rgb(r, gg, b);
        g.beginPath();
        g.arc(u * ART, v * ART, 8 + rnd() * 20, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      return c;
    },
  },
  {
    key: 'pop',
    name: 'Pop art',
    en: 'Pop art',
    ink: '#111',
    lineW: 4,
    linesOnTop: true,
    paper: '#fff',
    build(src, rnd) {
      const palettes = [
        ['#1b1f5e', '#e6287a', '#ffd23f', '#fff6e0'],
        ['#14213d', '#fb5607', '#3ec1d3', '#fdfcdc'],
        ['#2b193d', '#2ec4b6', '#ff9f1c', '#ffffff'],
      ];
      const pal = palettes[Math.floor(rnd() * palettes.length)].map((h) => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ]);
      const img = pixels(src, 280);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const k = Math.min(3, Math.floor((lum(d, i) / 256) * 4));
        [d[i], d[i + 1], d[i + 2]] = pal[k];
      }
      return upscale(img);
    },
  },
  {
    key: 'sketch',
    name: 'Chì than',
    en: 'Charcoal',
    ink: '#2b2b2b',
    lineW: 2.5,
    linesOnTop: true,
    paper: '#f6f3ee',
    build(src, rnd) {
      const c = mk(ART);
      const g = paper(c, '#f6f3ee', rnd, 1400);
      g.globalAlpha = 0.35;
      g.globalCompositeOperation = 'multiply';
      g.filter = 'grayscale(1) contrast(1.6)';
      g.drawImage(src, 0, 0, ART, ART);
      g.filter = 'none';
      g.globalCompositeOperation = 'source-over';
      const img = pixels(src, 140);
      g.lineCap = 'round';
      for (let i = 0; i < 4200; i++) {
        const u = rnd();
        const v = rnd();
        const p = (Math.floor(v * 140) * 140 + Math.floor(u * 140)) * 4;
        const dark = 1 - lum(img.data, p) / 255;
        if (rnd() > dark * 1.2) continue;
        const a = dark > 0.55 && rnd() < 0.5 ? -Math.PI / 4 : Math.PI / 4;
        const L = 8 + rnd() * 10;
        g.globalAlpha = 0.25 + dark * 0.45;
        g.strokeStyle = '#333';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(u * ART - Math.cos(a) * L, v * ART - Math.sin(a) * L);
        g.lineTo(u * ART + Math.cos(a) * L, v * ART + Math.sin(a) * L);
        g.stroke();
      }
      g.globalAlpha = 1;
      return c;
    },
  },
  {
    key: 'oil',
    name: 'Sơn dầu',
    en: 'Oil paint',
    ink: '#3a2a1e',
    lineW: 3,
    linesOnTop: false,
    paper: '#e8dcc8',
    build(src, rnd) {
      const at = sampler(src);
      const c = mk(ART);
      const g = ctx2(c);
      g.filter = 'blur(10px)';
      g.drawImage(src, 0, 0, ART, ART);
      g.filter = 'none';
      for (const [n, big] of [
        [1400, 1],
        [1800, 0.6],
      ] as const) {
        for (let i = 0; i < n; i++) {
          const u = rnd();
          const v = rnd();
          const [r, gg, b] = saturate(at(u, v), 1.2);
          const j = (rnd() - 0.5) * 30;
          g.fillStyle = rgb(r + j, gg + j, b + j);
          g.save();
          g.translate(u * ART, v * ART);
          g.rotate(0.5 + (rnd() - 0.5) * 0.9);
          g.beginPath();
          g.ellipse(0, 0, (9 + rnd() * 9) * big, (3.5 + rnd() * 3) * big, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = 'rgba(255,255,255,0.18)';
          g.fillRect(-4 * big, -1.5 * big, 7 * big, 1.2);
          g.restore();
        }
      }
      return c;
    },
  },
  {
    key: 'glass',
    name: 'Kính màu',
    en: 'Stained glass',
    ink: '#1c1c1c',
    lineW: 3,
    linesOnTop: true,
    paper: '#f5f0e6',
    build(src, rnd) {
      const R = 200;
      const img = pixels(src, R);
      const d = img.data;
      const seeds = Array.from({ length: 150 }, () => [rnd() * R, rnd() * R]);
      const cell = new Int16Array(R * R);
      const sum = seeds.map(() => [0, 0, 0, 0]);
      for (let y = 0; y < R; y++)
        for (let x = 0; x < R; x++) {
          let best = 0;
          let bd = Infinity;
          for (let s = 0; s < seeds.length; s++) {
            const dx = seeds[s][0] - x;
            const dy = seeds[s][1] - y;
            const dd = dx * dx + dy * dy;
            if (dd < bd) {
              bd = dd;
              best = s;
            }
          }
          cell[y * R + x] = best;
          const i = (y * R + x) * 4;
          sum[best][0] += d[i];
          sum[best][1] += d[i + 1];
          sum[best][2] += d[i + 2];
          sum[best][3]++;
        }
      const col = sum.map(([r, g, b, n]) => saturate([r / (n || 1), g / (n || 1), b / (n || 1)], 1.6));
      for (let y = 0; y < R; y++)
        for (let x = 0; x < R; x++) {
          const k = y * R + x;
          const edge = (x < R - 1 && cell[k + 1] !== cell[k]) || (y < R - 1 && cell[k + R] !== cell[k]);
          const [r, g, b] = edge ? [28, 28, 28] : col[cell[k]];
          const i = k * 4;
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = b;
        }
      const out = upscale(img);
      const g = ctx2(out);
      const shine = g.createLinearGradient(0, 0, ART, ART);
      shine.addColorStop(0, 'rgba(255,255,255,0.22)');
      shine.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.fillStyle = shine;
      g.fillRect(0, 0, ART, ART);
      return out;
    },
  },
  {
    key: 'dots',
    name: 'Chấm điểm',
    en: 'Pointillism',
    ink: '#4d4d6b',
    lineW: 2,
    linesOnTop: false,
    paper: '#fbf7ee',
    build(src, rnd) {
      const at = sampler(src);
      const c = mk(ART);
      const g = paper(c, '#fbf7ee', rnd, 0);
      for (const [step, rad] of [
        [10, 5.5],
        [8, 3.8],
      ]) {
        for (let y = 0; y < ART; y += step)
          for (let x = 0; x < ART; x += step) {
            const px = x + (rnd() - 0.5) * step;
            const py = y + (rnd() - 0.5) * step;
            const [r, gg, b] = saturate(at(px / ART, py / ART), 1.5);
            const j = (rnd() - 0.5) * 50;
            g.fillStyle = rgb(r + j, gg - j * 0.5, b + j * 0.3);
            g.beginPath();
            g.arc(px, py, rad * (0.7 + rnd() * 0.5), 0, Math.PI * 2);
            g.fill();
          }
      }
      return c;
    },
  },
  {
    key: 'comic',
    name: 'Truyện tranh',
    en: 'Comic',
    ink: '#000',
    lineW: 5,
    linesOnTop: true,
    paper: '#fff',
    build(src) {
      const R = 280;
      const img = pixels(src, R);
      const d = img.data;
      const q = (v: number) => Math.min(255, Math.round(v / 85) * 85 + 20);
      for (let i = 0; i < d.length; i += 4) {
        const [r, g, b] = saturate([d[i], d[i + 1], d[i + 2]], 1.5);
        d[i] = q(r);
        d[i + 1] = q(g);
        d[i + 2] = q(b);
      }
      const out = upscale(img);
      const g = ctx2(out);
      const L = pixels(src, 56);
      g.fillStyle = 'rgba(0,0,0,0.55)';
      for (let y = 0; y < 56; y++)
        for (let x = 0; x < 56; x++) {
          const dark = 1 - lum(L.data, (y * 56 + x) * 4) / 255;
          if (dark < 0.4) continue;
          g.beginPath();
          g.arc(x * 10 + 5 + (y % 2) * 5, y * 10 + 5, dark * 4.2, 0, Math.PI * 2);
          g.fill();
        }
      return out;
    },
  },
  {
    key: 'ink',
    name: 'Thủy mặc',
    en: 'Ink wash',
    ink: '#1d2430',
    lineW: 3.5,
    linesOnTop: true,
    paper: '#f3ecdc',
    build(src, rnd) {
      const c = mk(ART);
      const g = paper(c, '#f3ecdc', rnd, 1200);
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = 0.85;
      g.filter = 'grayscale(1) contrast(1.5) blur(4px)';
      g.drawImage(src, 0, 0, ART, ART);
      g.filter = 'grayscale(1) contrast(2.2) blur(1px)';
      g.globalAlpha = 0.35;
      g.drawImage(src, 0, 0, ART, ART);
      g.filter = 'none';
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      // dấu triện đỏ
      g.fillStyle = '#b3261e';
      g.fillRect(ART - 92, ART - 92, 62, 62);
      g.fillStyle = '#f3ecdc';
      g.font = 'bold 30px serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('Hội', ART - 61, ART - 60);
      return c;
    },
  },
];

// ---------- ảnh nguồn ----------
const SKIN = ['#f6d2b8', '#eec19f', '#d9a27c', '#b97d57', '#8d5a3b'];
const HAIR = ['#2b1d16', '#4a2f22', '#7a4a2a', '#c58b3a', '#1c1c2e', '#9b3b5a'];
const BG = ['#8ecae6', '#ffb4a2', '#b5e48c', '#ffd166', '#cdb4db', '#90e0ef'];

/** Không có avatar (giả lập, hoặc tải lỗi): tự vẽ 1 khuôn mặt hoạt hình theo tên */
export function faceFor(name: string) {
  const r = seeded(name);
  const any = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const c = mk(SRC);
  const g = ctx2(c);
  g.fillStyle = any(BG);
  g.fillRect(0, 0, SRC, SRC);
  const skin = any(SKIN);
  const hair = any(HAIR);
  g.fillStyle = any(['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#6d597a']);
  g.beginPath();
  g.ellipse(48, 104, 40, 26, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = skin;
  g.beginPath();
  g.ellipse(48, 50, 24, 28, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = hair;
  g.beginPath();
  const long = r() < 0.5;
  g.ellipse(48, 36, 27, 19, 0, Math.PI, 0);
  if (long) g.rect(21, 34, 9, 34), g.rect(66, 34, 9, 34);
  g.fill();
  g.fillStyle = '#222';
  g.beginPath();
  g.arc(39, 52, 2.8, 0, Math.PI * 2);
  g.arc(57, 52, 2.8, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#8a3b2f';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(48, 61, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  g.fillStyle = 'rgba(255,120,120,0.35)';
  g.beginPath();
  g.arc(34, 61, 4, 0, Math.PI * 2);
  g.arc(62, 61, 4, 0, Math.PI * 2);
  g.fill();
  return c;
}

const cache = new Map<string, Promise<HTMLCanvasElement>>();

/** Tải avatar qua server (/api/avatar), hỏng hoặc chậm quá 3 giây thì dùng mặt hoạt hình */
export function loadSource(key: string, name: string, avatar: string): Promise<HTMLCanvasElement> {
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Promise<HTMLCanvasElement>((resolve) => {
    if (!avatar) return resolve(faceFor(name));
    const img = new Image();
    const t = setTimeout(() => resolve(faceFor(name)), 3000);
    img.onload = () => {
      clearTimeout(t);
      const c = mk(SRC);
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      ctx2(c).drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, SRC, SRC);
      resolve(c);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(faceFor(name));
    };
    img.src = `/api/avatar?u=${encodeURIComponent(avatar)}`;
  });
  cache.set(key, p);
  if (cache.size > 60) cache.delete(cache.keys().next().value!); // shortcut: bỏ cái cũ nhất, đủ cho hàng chờ 30 người
  return p;
}

// ---------- dò nét ----------
/** Các đường nét (toạ độ trong tranh ART), đã xếp theo thứ tự cọ đi gần nhất */
export function traceLines(src: HTMLCanvasElement, rnd: () => number): number[][] {
  const S = SRC;
  const d = ctx2(src).getImageData(0, 0, S, S).data;
  const gray = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) gray[i] = lum(d, i * 4);
  const blur = new Float32Array(S * S);
  for (let y = 1; y < S - 1; y++)
    for (let x = 1; x < S - 1; x++) {
      let s = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += gray[(y + j) * S + x + i];
      blur[y * S + x] = s / 9;
    }
  const mag = new Float32Array(S * S);
  for (let y = 2; y < S - 2; y++)
    for (let x = 2; x < S - 2; x++) {
      const k = y * S + x;
      const gx = blur[k - S + 1] + 2 * blur[k + 1] + blur[k + S + 1] - blur[k - S - 1] - 2 * blur[k - 1] - blur[k + S - 1];
      const gy = blur[k + S - 1] + 2 * blur[k + S] + blur[k + S + 1] - blur[k - S - 1] - 2 * blur[k - S] - blur[k - S + 1];
      mag[k] = Math.hypot(gx, gy);
    }
  const sorted = Array.from(mag).sort((a, b) => a - b);
  const th = Math.max(18, sorted[Math.floor(sorted.length * 0.87)]);
  const edge = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) edge[i] = mag[i] >= th ? 1 : 0;

  const DIRS = [1, S + 1, S, S - 1, -1, -S - 1, -S, -S + 1];
  const chains: number[][] = [];
  for (let k = 0; k < S * S; k++) {
    if (!edge[k]) continue;
    const chain = [k];
    edge[k] = 0;
    let cur = k;
    let dir = 0;
    for (;;) {
      let next = -1;
      for (let t = 0; t < 8; t++) {
        const dd = (dir + [0, 1, 7, 2, 6, 3, 5, 4][t]) % 8; // ưu tiên đi thẳng
        const n = cur + DIRS[dd];
        if (n > 0 && n < S * S && edge[n] && Math.abs((n % S) - (cur % S)) <= 1) {
          next = n;
          dir = dd;
          break;
        }
      }
      if (next < 0) break;
      edge[next] = 0;
      chain.push(next);
      cur = next;
    }
    if (chain.length >= 4) chains.push(chain);
  }

  // đổi sang toạ độ tranh, làm mượt (trung bình 3 điểm), rung tay nhẹ
  const f = ART / S;
  const pts = chains.map((ch) => {
    const out: number[] = [];
    for (let i = 0; i < ch.length; i++) {
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (let j = Math.max(0, i - 1); j <= Math.min(ch.length - 1, i + 1); j++) {
        sx += ch[j] % S;
        sy += Math.floor(ch[j] / S);
        n++;
      }
      out.push((sx / n + 0.5) * f + (rnd() - 0.5) * 1.5, (sy / n + 0.5) * f + (rnd() - 0.5) * 1.5);
    }
    return out;
  });

  // thứ tự: nét kế là nét có đầu gần cây cọ nhất (đảo chiều nếu cần)
  const order: number[][] = [];
  let cx = ART / 2;
  let cy = 0;
  while (pts.length) {
    let bi = 0;
    let bd = Infinity;
    let rev = false;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const a = (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
      const b = (p[p.length - 2] - cx) ** 2 + (p[p.length - 1] - cy) ** 2;
      if (a < bd) [bd, bi, rev] = [a, i, false];
      if (b < bd) [bd, bi, rev] = [b, i, true];
    }
    let p = pts.splice(bi, 1)[0];
    if (rev) {
      const r: number[] = [];
      for (let i = p.length - 2; i >= 0; i -= 2) r.push(p[i], p[i + 1]);
      p = r;
    }
    order.push(p);
    cx = p[p.length - 2];
    cy = p[p.length - 1];
  }
  return order;
}

/** Đường cọ tô màu: đi zíc zắc từ trên xuống, mép hơi lượn */
export function colorPath(rnd: () => number): number[] {
  const rows = 7;
  const h = ART / rows;
  const out: number[] = [];
  for (let r = 0; r < rows; r++) {
    const y = h * (r + 0.5);
    const ltr = r % 2 === 0;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = -30 + (ltr ? t : 1 - t) * (ART + 60);
      out.push(x, y + Math.sin(t * Math.PI * 2 + r) * 14 + (rnd() - 0.5) * 6);
    }
  }
  return out;
}
