import { useEffect, useRef, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { GiftEvent, LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned, maskBanned } from '../live/bannedWords';
import { addScore, NameBatcher, type Players } from '../live/scoreboard';
import { detectWish, GiftThanker, makePicker, OncePerPerson, RecentPeople, WishLimiter } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { EN_LINES, GAME, TALK, TEXT, type Lang, type TalkLevel } from './config';
import { music } from './music';
import { sfx } from './sfx';
import type { Job } from './Easel';
import { STYLES, loadSource } from './portrait';
import { PAINTERS } from './Painter';
import { BACKGROUNDS } from './Scene';

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
  const [lang, setLang] = useState<Lang>('vi');
  const [painterIdx, setPainterIdx] = useState(0);
  const [bg, setBg] = useState(0);
  // Âm thanh + mức tương tác (server nhớ trong cài đặt riêng)
  const [sound, setSound] = useState({ rate: 1, musicOn: true, musicVol: 50, sfxOn: true, sfxVol: 60, talk: 'mid' as TalkLevel });
  const talkRef = useRef(sound.talk);
  talkRef.current = sound.talk;
  const queueRef = useRef<Waiting[]>([]);
  const langRef = useRef(lang);
  langRef.current = lang;
  // Bộ câu MC + tên đọc được theo bản đang chọn
  const S = () => (langRef.current === 'en' ? EN_LINES : GAME);
  const sn = (n: string) => {
    const s = speakableName(n);
    return langRef.current === 'en' && s === 'bạn' ? 'friend' : s;
  };
  const names = (list: string[], commasOnly = false) => (langRef.current === 'en' ? joinNamesEn(list, commasOnly) : joinNames(list, commasOnly));
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
      (list, more) => voice.say(S().greeting(names(list, more > 0), kenh.current, more)),
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
      const topic = containsBanned(e.comment) || langRef.current === 'en' ? null : detectWish(e.comment); // chỉ hiểu lời chúc tiếng Việt
      const reply = topic && pick(GAME.wishReplies[topic] ?? []);
      if (reply && talk.wishes.allow(e.username)) voice.say(reply(speakableName(name)));

      // --- Luật chơi: comment "vẽ tôi" / "draw me" thì vào cuối hàng (đang chờ hoặc đang được vẽ thì thôi) ---
      if (TEXT[langRef.current].keywords.some((k) => compact(e.comment).includes(k))) {
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
      if (thank) voice.say(S().thankGift(sn(name), e.giftName, kenh.current), true);

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
        if (thank) voice.say(S().giftPriority(sn(name)), true);
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
      if (talk.follows.first(e.username)) voice.say(S().thankFollow(sn(name), kenh.current));
    },

    onLike: (e) => {
      // Đếm theo tổng tim của phòng; lần đầu nhận được thì lấy làm mốc
      if (likeBase.current === null) likeBase.current = e.totalLikes - e.likeCount;
      const since = e.totalLikes - likeBase.current;
      if (since >= GAME.likesPerBoost) {
        likeBase.current += GAME.likesPerBoost;
        setBoostUntil(Date.now() + GAME.boostSeconds * 1000);
        voice.say(S().boostLine, true);
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
      // Bản tiếng Việt / tiếng Anh: server nhớ trong cài đặt riêng (setPrefs), gửi lại cho trang mới mở
      if (c.action === 'setPrefs' && c.text) {
        try {
          const p = JSON.parse(c.text);
          if (p.lang === 'vi' || p.lang === 'en') {
            setLang(p.lang);
            voice.lang = p.lang;
          }
          // Họa sĩ và nền chủ kênh chọn trước (không đổi ngẫu nhiên)
          const pi = Number(p.painter);
          if (Number.isInteger(pi) && pi >= 0 && pi < PAINTERS.length) setPainterIdx(pi);
          const bi = Number(p.bg);
          if (Number.isInteger(bi) && bi >= 0 && bi < BACKGROUNDS.length) setBg(bi);
          setSound((o) => {
            const n = { ...o };
            const r = Number(p.rate);
            if (r >= 0.7 && r <= 1.5) n.rate = r;
            if (p.music === 'on' || p.music === 'off') n.musicOn = p.music === 'on';
            const v = Number(p.musicVol);
            if (p.musicVol !== undefined && v >= 0 && v <= 100) n.musicVol = v;
            if (p.talk === 'low' || p.talk === 'mid' || p.talk === 'high') n.talk = p.talk;
            if (p.sfx === 'on' || p.sfx === 'off') n.sfxOn = p.sfx === 'on';
            const sv = Number(p.sfxVol);
            if (p.sfxVol !== undefined && sv >= 0 && sv <= 100) n.sfxVol = sv;
            sfx.on = n.sfxOn;
            sfx.level = n.sfxVol / 100;
            voice.rate = n.rate;
            music.on = n.musicOn;
            music.level = n.musicVol / 100;
            talk.greeter.everyMs = TALK[n.talk].greetEveryMs;
            return n;
          });
        } catch {
          // sai JSON: bỏ qua
        }
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
          const recent = talk.recent.latest(3, GAME.shareReminderEveryMs);
          const line = recent.length ? S().shareWithNames(names(recent), kenh.current) : pick(S().shareLines);
          if (line) voice.say(line);
        }, GAME.shareReminderEveryMs),
      );
    }
    // Rủ vẽ khi giá vẽ trống: thưa hay dày theo mức tương tác; có người vừa ghé thì gọi tên
    let lastInvite = Date.now();
    timers.push(
      setInterval(() => {
        if (jobRef.current || queueRef.current.length) return void (lastInvite = Date.now());
        if (Date.now() - lastInvite < TALK[talkRef.current].inviteEveryMs || voice.waiting > 0 || voice.quietForMs() < 3000) return;
        lastInvite = Date.now();
        const who = talk.recent.latest(1, 120_000)[0];
        const line = who && who !== 'bạn' && Math.random() < 0.5 ? S().inviteWithName(sn(who)) : pick(S().inviteLines);
        if (line) voice.say(line);
      }, 1000),
    );
    if (GAME.idleAfterMs > 0) {
      timers.push(
        setInterval(() => {
          if (voice.quietForMs() < GAME.idleAfterMs) return;
          const line = pick(S().idleLines);
          if (line) voice.say(line);
        }, 15_000),
      );
    }
    return () => timers.forEach(clearInterval);
  }, []);

  useEffect(() => music.start(), []); // nhạc nền chỉ phát ở trang stage
  queueRef.current = queue;

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
    if (voice.waiting === 0) {
      const line = pick<(name: string) => string>(S().finishLines);
      if (line) voice.say(line(sn(j.name)));
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
    lang,
    sound,
    players,
    queue,
    job,
    gallery,
    painter: PAINTERS[painterIdx],
    painterIdx,
    bg,
    finish,
    feed,
    lastGift,
    likeProgress,
    boosting: Date.now() < boostUntil,
  };
}

export type GameState = ReturnType<typeof useGame>;

// ['An', 'Bình', 'Chi'] -> 'bạn An, bạn Bình và bạn Chi'; commasOnly: 'bạn An, bạn Bình, bạn Chi' (câu sau còn "và N bạn nữa")
// Bản tiếng Anh: 'A, B and C' (không có chữ "bạn"; tên không đọc được thành "friend")
function joinNamesEn(names: string[], commasOnly = false) {
  const spoken = names.map((n) => (n === 'bạn' ? 'friend' : n));
  if (commasOnly) return spoken.join(', ');
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} and ${spoken[spoken.length - 1]}` : spoken[0] ?? '';
}

function joinNames(names: string[], commasOnly = false) {
  const spoken = names.map((n) => (n === 'bạn' ? n : `bạn ${n}`));
  if (commasOnly) return spoken.join(', ');
  return spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} và ${spoken[spoken.length - 1]}` : spoken[0] ?? '';
}
