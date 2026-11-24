// Nhạc nền nhẹ tự tạo bằng Web Audio (không dùng file nhạc nên không dính bản quyền).
// Vòng hợp âm êm (Cmaj7 - Am7 - Fmaj7 - G6), tiếng pad mềm + vài nốt đàn gảy ngũ cung, nhịp chậm.
// Chỉ phát trên trang stage. MC nói thì nhạc tự nhỏ xuống (ducking).
import { IS_STAGE } from '../live/page';
import { voice } from '../live/voice';

const BPM = 68;
const BEAT = 60 / BPM;
const CHORDS = [
  [48, 55, 59, 64], // Cmaj7
  [45, 52, 55, 60], // Am7
  [41, 48, 52, 57], // Fmaj7
  [43, 50, 55, 59], // G6
];
const MELODY = [72, 74, 76, 79, 81, 84]; // ngũ cung C
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

class Music {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private next = 0; // thời điểm ô nhịp kế tiếp
  private bar = 0;
  on = true;
  level = 0.5; // 0..1, chỉnh ở trang điều khiển

  start() {
    if (!IS_STAGE || this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(lp).connect(ctx.destination);
    // trình duyệt chặn tự phát thì thử lại định kỳ / khi có tương tác
    const resume = () => ctx.state !== 'running' && ctx.resume().catch(() => {});
    setInterval(resume, 3000);
    window.addEventListener('pointerdown', resume);
    // lên lịch trước ~2 giây, âm lượng trượt mượt về mức đích
    setInterval(() => {
      if (!this.out) return;
      const target = !this.on ? 0 : this.level * (voice.busy ? 0.35 : 1) * 0.22;
      this.out.gain.setTargetAtTime(target, ctx.currentTime, 0.25);
      if (ctx.state !== 'running') return;
      if (this.next < ctx.currentTime) this.next = ctx.currentTime + 0.1;
      while (this.next < ctx.currentTime + 2) this.scheduleBar(this.next);
    }, 250);
  }

  private scheduleBar(t: number) {
    const ctx = this.ctx!;
    const chord = CHORDS[this.bar % CHORDS.length];
    const len = BEAT * 4;
    // pad: 2 dao động hơi lệch nhau cho ấm, lên xuống từ từ
    for (const m of chord) {
      for (const detune of [-6, 6]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = hz(m);
        o.detune.value = detune;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.8);
        g.gain.setValueAtTime(0.05, t + len - 0.6);
        g.gain.linearRampToValueAtTime(0, t + len + 0.4);
        o.connect(g).connect(this.out!);
        o.start(t);
        o.stop(t + len + 0.5);
      }
    }
    // vài nốt gảy nhẹ, mỗi ô nhịp 3-5 nốt ngẫu nhiên trong ngũ cung
    const notes = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notes; i++) {
      const at = t + Math.floor(Math.random() * 8) * (BEAT / 2);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = hz(MELODY[Math.floor(Math.random() * MELODY.length)]);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.09, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, at + 1.6);
      o.connect(g).connect(this.out!);
      o.start(at);
      o.stop(at + 1.7);
    }
    this.next = t + len;
    this.bar++;
  }
}

export const music = new Music();
