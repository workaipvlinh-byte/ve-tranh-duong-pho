import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { useGame } from './game/useGame';
import { GameStage } from './game/GameStage';

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
      autoLive={{
        durationMs: 120_000,
        comment: () => ['vẽ tôi', 'Vẽ tôi với', 'draw me', 'vẽ tôi đi họa sĩ', 'đẹp quá', 'hello'][Math.floor(Math.random() * 6)],
      }}
      preview={
        <StageFrame maxHeight={720}>
          <GameStage game={game} />
        </StageFrame>
      }
    />
  );
}
