import { useEffect, useMemo, useState, type ReactNode } from "react";
import { IS_STAGE, STAGE_H, STAGE_W, sendControl } from "./live/page";
import { StageFrame } from "./live/StageFrame";
import { Dashboard } from "./live/Dashboard";
import { useGame } from "./game/useGame";
import { GameStage } from "./game/GameStage";
import { PAINTERS, Painter } from "./game/Painter";
import { BACKGROUNDS, Scene } from "./game/Scene";
import { PAINTER, type Brush } from "./game/layout";

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
                  <Painter p={p} brush={idle} lines={[]} label="" />
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
