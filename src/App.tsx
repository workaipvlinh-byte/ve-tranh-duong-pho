import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useGame } from './game/useGame';
import { GameStage } from './game/GameStage';
import { sendControl } from './live/page';

export default function App() {
  const game = useGame();

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

  // Trang điều khiển
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      voiceWho={game.voiceWho}
      top={
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-2 font-semibold">Bản game</div>
          <div className="flex gap-2">
            {(
              [
                ['vi', 'Tiếng Việt (vẽ tôi)'],
                ['en', 'English (draw me)'],
              ] as const
            ).map(([l, label]) => (
              <button
                key={l}
                onClick={() => sendControl('setPrefs', JSON.stringify({ lang: l }))}
                className={`rounded-lg px-4 py-2 font-semibold ${game.lang === l ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      }
      autoLive={{
        durationMs: 120_000,
        comment: () =>
          (game.lang === 'en' ? ['draw me', 'Draw me pls', 'draw me!!', 'so cute', 'hello'] : ['vẽ tôi', 'Vẽ tôi với', 'vẽ tôi đi họa sĩ', 'đẹp quá', 'hello'])[
            Math.floor(Math.random() * 5)
          ],
      }}
      preview={
        <StageFrame maxHeight={720}>
          <GameStage game={game} />
        </StageFrame>
      }
    />
  );
}
