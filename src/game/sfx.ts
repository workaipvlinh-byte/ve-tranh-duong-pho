// Tiếng vẽ: bút chì lúc phác nét, bút dạ lúc tô màu. Chỉ phát ở trang stage. MC đang nói thì nhỏ lại.
import { IS_STAGE } from '../live/page';
import { voice } from '../live/voice';

const FILES = { pencil: '/assets/sfx/but-chi.mp3', color: '/assets/sfx/to-mau.mp3' };
type Kind = keyof typeof FILES;

class Sfx {
  on = true;
  level = 0.6; // 0..1, chỉnh ở trang điều khiển
  private base: Record<Kind, HTMLAudioElement> | null = null;

  play(kind: Kind) {
    if (!IS_STAGE || !this.on || this.level <= 0) return;
    if (!this.base) this.base = { pencil: new Audio(FILES.pencil), color: new Audio(FILES.color) };
    const a = this.base[kind].cloneNode() as HTMLAudioElement;
    a.volume = Math.min(1, this.level * (voice.busy ? 0.5 : 1));
    a.play().catch(() => {}); // trình duyệt chặn tự phát thì thôi, không ảnh hưởng game
  }
}

export const sfx = new Sfx();
