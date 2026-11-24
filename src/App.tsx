import { useEffect, useMemo, useState, type ReactNode } from "react";
import { IS_STAGE, STAGE_H, STAGE_W, sendControl } from "./live/page";
import { StageFrame } from "./live/StageFrame";
import { Dashboard } from "./live/Dashboard";
import { useGame } from "./game/useGame";
import { GameStage } from "./game/GameStage";
import { PAINTERS, Painter } from "./game/Painter";
import { BACKGROUNDS, Scene } from "./game/Scene";
import { PAINTER, type Brush } from "./game/layout";
import { TALK, type TalkLevel } from "./game/config";
import type { GameState } from "./game/useGame";

const setPref = (k: string, v: string) =>
  sendControl("setPrefs", JSON.stringify({ [k]: v }));

/** Vẽ nội dung khung 1080x1920 thu nhỏ theo bề rộng cho trước (xem trước, ảnh nhỏ) */
function Mini({ width, children }: { width: number; children: ReactNode }) {
  const s = width / STAGE_W;
  return (
    <div
      className="relative overflow-hidden"
      style={{ width, height: STAGE_H * s }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${s})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Trang điều khiển gói trong 1 khung dọc 1080x1920, tự co cho vừa cửa sổ */
function ControlFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () =>
      setScale(
        Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H),
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="flex h-screen w-screen items-start justify-center overflow-hidden bg-black">
      <div
        style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
        className="relative"
      >
        <div
          className="absolute left-0 top-0 overflow-hidden bg-slate-950"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const pick = (cur: boolean) =>
  cur
    ? "ring-4 ring-amber-400"
    : "ring-1 ring-slate-700 opacity-80 hover:opacity-100";

export default function App() {
  const game = useGame();
  const idle = useMemo<Brush>(
    () => ({ x: 0, y: 0, mode: "idle", color: "#3b2a20" }),
    [],
  );

  // Trang cho TikTok LIVE Studio: chỉ có màn hình game
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <StageFrame>
          <GameStage game={game} />
        </StageFrame>
      </div>
    );
  }

  // Trang điều khiển: bên trái kết nối / giọng / giả lập, bên phải xem trước + chọn họa sĩ, nền
  const settings = (
    <div className="mt-3 w-[460px] space-y-3 rounded-2xl bg-slate-900 p-3 text-slate-100 ring-1 ring-slate-800">
      <div>
        <div className="mb-1 text-sm font-semibold">
          Họa sĩ: <span className="text-amber-300">{game.painter.name}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PAINTERS.map((p, i) => (
            <button
              key={p.name}
              title={p.name}
              onClick={() => setPref("painter", String(i))}
              className={`overflow-hidden rounded-lg bg-[#ffe9c9] ${pick(game.painterIdx === i)}`}
            >
              <div className="relative h-[104px] w-full overflow-hidden">
                <div
                  className="absolute"
                  style={{
                    left: -PAINTER.x * 0.24 + 4,
                    top: -(PAINTER.y - 10) * 0.24,
                    width: STAGE_W,
                    height: STAGE_H,
                    transform: "scale(0.24)",
                    transformOrigin: "top left",
                  }}
                >
                  <Painter p={p} brush={idle} lines={[]} label={p.name} />
                </div>
              </div>
              <div className="truncate bg-slate-800 px-1 text-[11px]">
                {p.name}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-sm font-semibold">
          Nền:{" "}
          <span className="text-amber-300">{BACKGROUNDS[game.bg].name}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {BACKGROUNDS.map((b, i) => (
            <button
              key={b.name}
              title={b.name}
              onClick={() => setPref("bg", String(i))}
              className={`overflow-hidden rounded-lg ${pick(game.bg === i)}`}
            >
              <div className="h-[96px] overflow-hidden">
                <Mini width={80}>
                  <Scene bg={i} />
                </Mini>
              </div>
              <div className="truncate bg-slate-800 px-1 text-[11px]">
                {b.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ControlFrame>
      <div className="flex gap-4 p-4">
        {/* cột trái: phần điều khiển chung (khung xem trước của Dashboard ẩn đi, đã có cột phải) */}
        <div className="w-[580px] shrink-0 [&_.justify-self-center]:hidden [&>div]:min-h-0 [&>div]:p-0">
          <Dashboard
            status={game.status}
            channelName={game.channelName}
            voiceWho={game.voiceWho}
            top={
              <section className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
                <h2 className="mb-3 font-semibold">Bản game</h2>
                <div className="flex gap-2">
                  {(
                    [
                      ["vi", "Tiếng Việt (vẽ tôi)"],
                      ["en", "English (draw me)"],
                    ] as const
                  ).map(([l, label]) => (
                    <button
                      key={l}
                      onClick={() => setPref("lang", l)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${game.lang === l ? "bg-amber-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <SoundSettings game={game} />
              </section>
            }
            autoLive={{
              durationMs: 120_000,
              comment: () =>
                (game.lang === "en"
                  ? ["draw me", "Draw me pls", "draw me!!", "so cute", "hello"]
                  : [
                      "vẽ tôi",
                      "Vẽ tôi với",
                      "vẽ tôi đi họa sĩ",
                      "đẹp quá",
                      "hello",
                    ])[Math.floor(Math.random() * 5)],
            }}
            preview={null}
          />
        </div>
        <div className="shrink-0 pt-1">
          <div className="mb-1 text-center text-sm text-slate-400">
            Xem trước (im lặng)
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-slate-700">
            <Mini width={460}>
              <GameStage game={game} />
            </Mini>
          </div>
          {settings}
        </div>
      </div>
    </ControlFrame>
  );
}

/** Âm thanh + MC: nhạc nền, tiếng bút, tốc độ giọng, mức nói chuyện. Server nhớ, áp cho trang stage. */
function SoundSettings({ game }: { game: GameState }) {
  const s = game.sound;
  const chip = (on: boolean) => `rounded-lg px-3 py-1.5 text-sm font-medium ${on ? "bg-amber-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700"}`;
  const row = "mt-3 flex flex-wrap items-center gap-2 text-sm";
  const Vol = ({ k, onKey, on, vol, label }: { k: string; onKey: string; on: boolean; vol: number; label: string }) => (
    <div className={row}>
      <span className="w-24">{label}</span>
      <button className={chip(on)} onClick={() => setPref(onKey, on ? "off" : "on")}>
        {on ? "Bật" : "Tắt"}
      </button>
      <input type="range" min={0} max={100} step={5} defaultValue={vol} key={vol} onPointerUp={(e) => setPref(k, (e.target as HTMLInputElement).value)} onKeyUp={(e) => setPref(k, (e.target as HTMLInputElement).value)} className="w-40 accent-amber-500" />
      <b className="w-10 text-right">{vol}%</b>
    </div>
  );
  return (
    <div className="mt-4 border-t border-slate-800 pt-3">
      <h2 className="font-semibold">Âm thanh và MC</h2>
      <Vol k="musicVol" onKey="music" on={s.musicOn} vol={s.musicVol} label="Nhạc nền" />
      <Vol k="sfxVol" onKey="sfx" on={s.sfxOn} vol={s.sfxVol} label="Tiếng bút vẽ" />
      <div className={row}>
        <span className="w-24">Tốc độ giọng</span>
        {["0.85", "1", "1.15", "1.3"].map((r) => (
          <button key={r} className={chip(s.rate === Number(r))} onClick={() => setPref("rate", r)}>
            {r}×
          </button>
        ))}
      </div>
      <div className={row}>
        <span className="w-24">MC nói chuyện</span>
        {(Object.keys(TALK) as TalkLevel[]).map((k) => (
          <button key={k} className={chip(s.talk === k)} onClick={() => setPref("talk", k)}>
            {TALK[k].name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Mức nói chuyện: chào người vào nhanh hay chậm, giá vẽ trống thì rủ comment {game.lang === "en" ? "“draw me”" : "“vẽ tôi”"} mỗi {TALK[s.talk].inviteEveryMs / 1000} giây. Áp dụng cả bản Việt và bản Anh.
      </p>
    </div>
  );
}
