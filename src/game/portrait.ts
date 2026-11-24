// Bộ vẽ chân dung: từ ảnh avatar (hoặc mặt hoạt hình tự sinh khi không tải được) ra 2 lớp
//   - nét chì (danh sách đường, vẽ dần từng đoạn)
//   - màu (chính ảnh avatar, lộ dần theo vệt cọ)
// Toàn bộ vẽ bằng canvas, không dùng ảnh ngoài.

export const ART = 560; // cỡ tranh (điểm ảnh trong canvas)
const SRC = 96; // cỡ ảnh đem dò nét
const SRC_HI = 256; // cỡ ảnh nguồn giữ lại để tô màu (avatar lớn thì tranh nét)

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
      const c = mk(SRC_HI);
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const g = ctx2(c);
      g.imageSmoothingQuality = "high";
      g.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, SRC_HI, SRC_HI);
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
  const d = pixels(src, S).data; // ảnh nguồn có thể lớn hơn 96px
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

/** Ảnh avatar phóng lên cỡ tranh (lớp "tô màu": vẽ ra đúng ảnh của người xem) */
export function photo(src: HTMLCanvasElement) {
  const c = mk(ART);
  const g = ctx2(c);
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, ART, ART);
  return c;
}
