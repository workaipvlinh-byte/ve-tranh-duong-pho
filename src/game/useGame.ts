import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned, maskBanned } from '../live/bannedWords';
import { addScore, NameBatcher, type Players } from '../live/scoreboard';
import { detectWish, GiftThanker, makePicker, OncePerPerson, RecentPeople, WishLimiter } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import type { Job } from './Easel';
import { STYLES, loadSource } from './portrait';
import { PAINTERS } from './Painter';

const pick = makePicker();
voice.defaultWho = GAME.voice; // server gửi lại giọng đã chọn (setVoice) ngay khi trang nối vào

// Bỏ dấu, thường hoá, bỏ khoảng trắng: "Tham Gia" -> "thamgia"
const compact = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');

export interface FeedItem {
  id: number;
  kind: 'chat' | 'gift' | 'join' | 'follow';
  name: string;
  avatar: string;
  text: string;
}

const MAX_FEED = 30;
let feedId = 0;
let jobId = Date.now(); // không đụng id cũ khi sửa code nóng (HMR)

export interface Waiting {
  username: string;
  name: string;
  avatar: string;
  vip: boolean; // đã tặng quà: được vẽ ngay sau bức đang vẽ
}
export interface Hung {
  id: number;
  name: string;
  img: string;
  vip: boolean;
  style: string;
}

/**
 * Toàn bộ logic game nằm ở đây. Màn hình (GameStage) chỉ đọc state trả về.
 * Game mới: giữ khung này, thay phần "luật chơi" trong từng handler.
 */
export function useGame() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [players, setPlayers] = useState<Players>({});
  const [queue, setQueue] = useState<Waiting[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [gallery, setGallery] = useState<Hung[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const jobRef = useRef(job);
  jobRef.current = job;
  const lastStyle = useRef(-1);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [lastGift, setLastGift] = useState<GiftEvent | null>(null);
  const [likeProgress, setLikeProgress] = useState(0); // 0..likesPerBoost
  const [boostUntil, setBoostUntil] = useState(0);
  const [voiceWho, setVoiceWho] = useState(voice.defaultWho);
  const likeBase = useRef<number | null>(null);

  // Tên kênh: trang điều khiển lưu, server nhớ, mọi trang dùng (tiêu đề + giọng đọc)
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);
  const kenh = useRef(channelName);
  kenh.current = channelName;

  // Luật nói chuyện chung (xem src/live/chatter.ts). Tạo 1 lần, giữ nguyên suốt buổi live.
  const [talk] = useState(() => ({
    greeter: new NameBatcher(
      GAME.greetEveryMs,
      GAME.namesPerGreeting,
      (names, more) => voice.say(GAME.greeting(joinNames(names, more > 0), kenh.current, more)),
      () => voice.waiting >= 2, // giọng còn nhiều câu chờ thì để lượt sau
    ),
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
    wishes: new WishLimiter(GAME.wishPerUserMs, GAME.wishGlobalMs),
    recent: new RecentPeople(),
  }));

  const pushFeed = (item: Omit<FeedItem, 'id'>) =>
    setFeed((f) => [...f.slice(-(MAX_FEED - 1)), { ...item, id: ++feedId }]);

  // Tên an toàn để hiện/đọc: tên có từ cấm thì dùng username
  const safeName = (nickname: string, username: string) => (containsBanned(nickname) ? username : nickname);

  useLiveEvents({
    onStatus: setStatus,

    onChat: (e) => {
      const name = safeName(e.nickname, e.username);
      setPlayers((p) => addScore(p, { ...e, nickname: name }, GAME.pointsPerComment));
      pushFeed({ kind: 'chat', name, avatar: e.avatar, text: maskBanned(e.comment) });
      talk.recent.note(e.username, speakableName(name));

      // Comment có lời cầu chúc -> đọc 1 câu chúc soạn sẵn (không bao giờ đọc nguyên văn comment)
      const topic = containsBanned(e.comment) ? null : detectWish(e.comment);
      const reply = topic && pick(GAME.wishReplies[topic] ?? []);
      if (reply && talk.wishes.allow(e.username)) voice.say(reply(speakableName(name)));

      // --- Luật chơi: comment "vẽ tôi" / "draw me" thì vào cuối hàng (đang chờ hoặc đang được vẽ thì thôi) ---
      if (GAME.joinKeywords.some((k) => compact(e.comment).includes(k))) {
        if (jobRef.current?.username === e.username) return;
        setQueue((q) =>
          q.length >= GAME.maxQueue || q.some((w) => w.username === e.username)
            ? q
            : [...q, { username: e.username, name, avatar: e.avatar, vip: false }],
        );
      }
    },

    onGift: (e) => {
      const name = safeName(e.nickname, e.username);
      const coins = e.diamondCount * e.repeatCount;
      setPlayers((p) => addScore(p, { ...e, nickname: name }, coins * GAME.pointsPerCoin, coins));
      setLastGift({ ...e, nickname: name });
      pushFeed({ kind: 'gift', name, avatar: e.avatar, text: `tặng ${e.repeatCount} × ${e.giftName}` });
      talk.recent.note(e.username, speakableName(name));

      // Combo / tặng liên tục chỉ cảm ơn 1 lần mỗi 30 giây; quà to luôn cảm ơn. Chen lên trước câu khác.
      const thank = talk.gifts.shouldThank(e.username, coins, voice.waitingPriority);
      if (thank) voice.say(GAME.thankGift(speakableName(name), e.giftName, kenh.current), true);

      // --- Luật chơi: tặng quà thì được vẽ ngay sau bức đang vẽ (xếp sau những người tặng trước) ---
      if (jobRef.current?.username !== e.username) {
        setQueue((q) => {
          const old = q.find((w) => w.username === e.username);
          if (old?.vip) return q;
          const rest = q.filter((w) => w.username !== e.username);
          const at = rest.findIndex((w) => !w.vip);
          const me = { username: e.username, name, avatar: e.avatar || old?.avatar || '', vip: true };
          return at < 0 ? [...rest, me] : [...rest.slice(0, at), me, ...rest.slice(at)];
        });
        if (thank) voice.say(GAME.giftPriority(speakableName(name)), true);
      }
    },

    onMember: (e) => {
      const name = safeName(e.nickname, e.username);
      pushFeed({ kind: 'join', name, avatar: e.avatar, text: 'vừa vào' });
      const spoken = speakableName(name);
      if (spoken !== 'bạn') talk.greeter.add(e.username, spoken); // mỗi người chào 1 lần; tên đọc không được thì thôi
    },

    onFollow: (e) => {
      const name = safeName(e.nickname, e.username);
      pushFeed({ kind: 'follow', name, avatar: e.avatar, text: 'đã theo dõi' });
      if (talk.follows.first(e.username)) voice.say(GAME.thankFollow(speakableName(name), kenh.current));
    },

    onLike: (e) => {
      // Đếm theo tổng tim của phòng; lần đầu nhận được thì lấy làm mốc
      if (likeBase.current === null) likeBase.current = e.totalLikes - e.likeCount;
      const since = e.totalLikes - likeBase.current;
      if (since >= GAME.likesPerBoost) {
        likeBase.current += GAME.likesPerBoost;
        setBoostUntil(Date.now() + GAME.boostSeconds * 1000);
        voice.say(GAME.boostLine, true);
      }
      setLikeProgress(Math.max(0, e.totalLikes - likeBase.current));
    },

    onControl: (c) => {
      // Tên kênh áp dụng cho mọi trang (ô nhập ở trang điều khiển + tiêu đề, giọng đọc trên stage)
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      // Chọn giọng nam/nữ: mọi trang cùng đổi để nút ở trang điều khiển hiện đúng
      if (c.action === 'setVoice' && (c.text === 'M' || c.text === 'F')) {
        voice.defaultWho = c.text;
        setVoiceWho(c.text);
      }
      if (!IS_STAGE) return; // chỉ trang stage làm theo lệnh, tránh 2 giọng
      if (c.action === 'speak' && c.text) voice.say(c.text, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        talk.greeter.reset();
        talk.gifts.reset();
        talk.follows.reset();
        talk.wishes.reset();
        talk.recent.reset();
        setPlayers({});
        setQueue([]);
        setJob(null);
        setGallery([]);
        setDoneCount(0);
        setFeed([]);
      }
    },
  });

  // Nhắc chia sẻ live định kỳ + đọc 1 câu khi live im quá lâu (chỉ trang stage có tiếng)
  useEffect(() => {
    if (!IS_STAGE) return;
    const timers: ReturnType<typeof setInterval>[] = [];
    if (GAME.shareReminderEveryMs > 0) {
      timers.push(
        setInterval(() => {
          const names = talk.recent.latest(3, GAME.shareReminderEveryMs);
          const line = names.length ? GAME.shareWithNames(joinNames(names), kenh.current) : pick(GAME.shareLines);
          if (line) voice.say(line);
        }, GAME.shareReminderEveryMs),
      );
    }
    if (GAME.idleAfterMs > 0) {
      timers.push(
        setInterval(() => {
          if (voice.quietForMs() < GAME.idleAfterMs) return;
          const line = pick(GAME.idleLines);
          if (line) voice.say(line);
        }, 15_000),
      );
    }
    return () => timers.forEach(clearInterval);
  }, []);

  // Giá vẽ rảnh mà có người chờ: gọi người đầu hàng lên (nghỉ 0,5 giây cho tranh cũ bay lên dây)
  useEffect(() => {
    if (job || !queue.length) return;
    const t = setTimeout(() => {
      const [next, ...rest] = queue;
      let style = Math.floor(Math.random() * STYLES.length);
      if (style === lastStyle.current) style = (style + 1) % STYLES.length;
      lastStyle.current = style;
      setQueue(rest);
      setJob({ id: ++jobId, username: next.username, name: next.name, avatar: next.avatar, style, vip: next.vip });
    }, 500);
    return () => clearTimeout(t);
  }, [job, queue]);

  // Tải sẵn avatar người kế tiếp trong lúc đang vẽ
  useEffect(() => {
    const w = queue[0];
    if (w) loadSource(w.username, w.name, w.avatar);
  }, [queue[0]?.username]);

  // Giá vẽ báo xong 1 bức: treo lên dây, đổi họa sĩ mỗi vài bức
  const finish = (id: number, img: string) => {
    const j = jobRef.current;
    if (!j || j.id !== id) return;
    setGallery((g) => [{ id, name: j.name, img, vip: j.vip, style: STYLES[j.style].name }, ...g].slice(0, GAME.galleryMax));
    const n = doneCount + 1;
    setDoneCount(n);
    setJob(null);
    if (n % GAME.paintersEvery === 0) voice.say(GAME.painterLine(PAINTERS[(n / GAME.paintersEvery) % PAINTERS.length].name));
    else if (voice.waiting === 0) {
      const line = pick(GAME.finishLines);
      if (line) voice.say(line(speakableName(j.name)));
    }
  };

  // Ẩn banner quà sau 5 giây
  useEffect(() => {
    if (!lastGift) return;
    const t = setTimeout(() => setLastGift(null), 5000);
    return () => clearTimeout(t);
  }, [lastGift]);

  // Tick để boost tự tắt
  const [, force] = useState(0);
  useEffect(() => {
    if (!boostUntil) return;
    const t = setTimeout(() => force((x) => x + 1), boostUntil - Date.now() + 50);
    return () => clearTimeout(t);
  }, [boostUntil]);

  return {
    status,
    channelName,
    voiceWho,
    players,
    queue,
    job,
    gallery,
    painter: PAINTERS[Math.floor(doneCount / GAME.paintersEvery) % PAINTERS.length],
    finish,
    feed,
    lastGift,
    likeProgress,
    boosting: Date.now() < boostUntil,
  };
}

export type GameState = ReturnType<typeof useGame>;

// ['An', 'Bình', 'Chi'] -> 'bạn An, bạn Bình và bạn Chi'; commasOnly: 'bạn An, bạn Bình, bạn Chi' (câu sau còn "và N bạn nữa")
function joinNames(names: string[], commasOnly = false) {
  const spoken = names.map((n) => (n === 'bạn' ? n : `bạn ${n}`));
  if (commasOnly) return spoken.join(', ');
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} và ${spoken[spoken.length - 1]}` : spoken[0] ?? '';
}
