import { useEffect, useRef } from "react";
import {
  ART,
  STYLES,
  colorPath,
  loadSource,
  seeded,
  traceLines,
} from "./portrait";
import { CANVAS, TIMES, type Brush } from "./layout";
import { TEXT, type Lang } from "./config";

export interface Job {
  id: number;
  username: string;
  name: string;
  avatar: string;
  style: number;
  vip: boolean;
}

const k = CANVAS.size / ART;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const mk = () => {
  const c = document.createElement("canvas");
  c.width = c.height = ART;
  return c;
};

/** Giá vẽ: chạy 1 phiên vẽ cho `job`, xong gọi onDone(ảnh nhỏ để treo lên dây) */
export function Easel({
  job,
  brush,
  lang,
  onDone,
}: {
  job: Job | null;
  brush: Brush;
  lang: Lang;
  onDone: (id: number, img: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const view = ref.current!.getContext("2d")!;
    if (!job) {
      brush.mode = "idle";
      // giữ tranh vừa xong 1 lúc; hàng còn người thì bức kế tới trước khi kịp hiện chữ mời
      const t = setTimeout(() => {
        view.fillStyle = "#fbf6ec";
        view.fillRect(0, 0, ART, ART);
        view.fillStyle = "#b8a58c";
        view.font = '600 38px "Be Vietnam Pro", sans-serif';
        view.textAlign = "center";
        view.fillText(`Comment “${TEXT[lang].keyword}”`, ART / 2, ART / 2 - 10);
        view.font = '32px "Be Vietnam Pro", sans-serif';
        view.fillText(TEXT[lang].idle, ART / 2, ART / 2 + 40);
      }, 900);
      return () => clearTimeout(t);
    }
    let stop = false;
    let raf = 0;
    (async () => {
      const src = await loadSource(job.username, job.name, job.avatar);
      if (stop) return;
      const style = STYLES[job.style];
      const rnd = seeded(job.username + job.id);
      const lines = traceLines(src, rnd);
      const art = style.build(src, rnd);
      const path = colorPath(rnd);
      const total = lines.reduce((s, l) => s + l.length / 2, 0);
      const segLen: number[] = [0];
      for (let i = 2; i < path.length; i += 2)
        segLen.push(
          segLen[segLen.length - 1] +
            Math.hypot(path[i] - path[i - 2], path[i + 1] - path[i - 1]),
        );
      const pathLen = segLen[segLen.length - 1];

      const lineLayer = mk();
      const lg = lineLayer.getContext("2d")!;
      lg.strokeStyle = style.ink;
      lg.lineCap = lg.lineJoin = "round";
      const mask = mk();
      const mg = mask.getContext("2d")!;
      mg.strokeStyle = "#000";
      mg.lineCap = mg.lineJoin = "round";
      mg.lineWidth = 150;
      const tmp = mk();
      const tg = tmp.getContext("2d")!;

      let drawn = 0;
      let ci = 0;
      let pi = 0;
      let seg = 1; // đoạn kế tiếp của đường tô màu
      let bx = ART / 2;
      let by = 0;
      brush.color = style.ink;

      const render = (color: boolean) => {
        view.fillStyle = style.paper;
        view.fillRect(0, 0, ART, ART);
        if (!style.linesOnTop) view.drawImage(lineLayer, 0, 0);
        if (color) {
          tg.globalCompositeOperation = "source-over";
          tg.clearRect(0, 0, ART, ART);
          tg.drawImage(art, 0, 0);
          tg.globalCompositeOperation = "destination-in";
          tg.drawImage(mask, 0, 0);
          view.drawImage(tmp, 0, 0);
        }
        if (style.linesOnTop) view.drawImage(lineLayer, 0, 0);
      };
      const drawLinesTo = (target: number) => {
        while (drawn < target && ci < lines.length) {
          const L = lines[ci];
          if (pi === 0) lg.lineWidth = style.lineW * (0.8 + rnd() * 0.5);
          else {
            lg.beginPath();
            lg.moveTo(L[pi * 2 - 2], L[pi * 2 - 1]);
            lg.lineTo(L[pi * 2], L[pi * 2 + 1]);
            lg.stroke();
          }
          bx = L[pi * 2];
          by = L[pi * 2 + 1];
          pi++;
          drawn++;
          if (pi * 2 >= L.length) {
            ci++;
            pi = 0;
          }
        }
      };

      const t0 = performance.now();
      const frame = (now: number) => {
        if (stop) return;
        const t = now - t0;
        if (t < TIMES.line) {
          brush.mode = "line";
          drawLinesTo(total * ease(t / TIMES.line));
          render(false);
        } else if (t < TIMES.line + TIMES.color) {
          drawLinesTo(Infinity);
          brush.mode = "color";
          brush.color = "#c0392b";
          const want = pathLen * ease((t - TIMES.line) / TIMES.color);
          while (seg < segLen.length && segLen[seg - 1] < want) {
            mg.beginPath();
            mg.moveTo(path[seg * 2 - 2], path[seg * 2 - 1]);
            mg.lineTo(path[seg * 2], path[seg * 2 + 1]);
            mg.stroke();
            bx = path[seg * 2];
            by = path[seg * 2 + 1];
            seg++;
          }
          render(true);
        } else if (t < TIMES.line + TIMES.color + TIMES.show) {
          if (brush.mode !== "show") {
            mg.fillRect(0, 0, ART, ART);
            render(true);
            brush.mode = "show";
          }
        } else {
          const thumb = document.createElement("canvas");
          thumb.width = thumb.height = 240;
          thumb.getContext("2d")!.drawImage(ref.current!, 0, 0, 240, 240);
          brush.mode = "idle";
          done.current(job.id, thumb.toDataURL("image/jpeg", 0.82));
          return;
        }
        brush.x = CANVAS.x + Math.min(ART, Math.max(0, bx)) * k;
        brush.y = CANVAS.y + Math.min(ART, Math.max(0, by)) * k;
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    })();
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
    };
  }, [job?.id, job ? '' : lang]);

  return (
    <canvas
      ref={ref}
      width={ART}
      height={ART}
      className="absolute"
      style={{
        left: CANVAS.x,
        top: CANVAS.y,
        width: CANVAS.size,
        height: CANVAS.size,
      }}
    />
  );
}
