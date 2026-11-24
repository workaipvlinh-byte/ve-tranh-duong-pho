// =====================================================
//  CẤU HÌNH GAME - phần lớn thay đổi nhỏ chỉ cần sửa file này
//  Câu đọc: `name` = tên người xem (đã làm sạch), `kenh` = tên kênh (ô "Tên kênh" ở trang điều khiển)
//  Muốn tắt tính năng nào thì để số thời gian = 0 hoặc danh sách câu rỗng [].
// =====================================================

import type { WishTopic } from '../live/chatter';

// ---------- 2 bản: tiếng Việt / tiếng Anh (chọn ở trang điều khiển) ----------
// Chữ trên màn hình + từ khóa xin vẽ đổi theo bản. Giọng MC vẫn đọc câu tiếng Việt bên dưới.
export type Lang = 'vi' | 'en';
export const TEXT = {
  vi: {
    title: 'XƯỞNG VẼ PHỐ HỘI',
    keyword: 'vẽ tôi',
    // so sánh không dấu, không hoa thường, bỏ khoảng trắng
    keywords: ['vetoi', 'veminh', 'vechotoi'],
    queue: 'Hàng chờ',
    next: 'Kế tiếp',
    more: (n: number) => `+${n} người đang chờ`,
    style: 'Phong cách',
    painter: 'Họa sĩ',
    likes: 'Thả tim cho phố lên đèn',
    hangHere: 'Tranh của bạn treo ở đây',
    idle: 'để được vẽ chân dung',
    show: ['Đẹp chưa nè!', 'Xong rồi nha!', 'Ưng không bạn?', 'Tuyệt tác!', 'Treo lên thôi!', 'Hết sẩy!', 'Giống y chang!'],
  },
  en: {
    title: 'HOI AN PORTRAIT STUDIO',
    keyword: 'draw me',
    keywords: ['drawme'],
    queue: 'Queue',
    next: 'Next',
    more: (n: number) => `+${n} more waiting`,
    style: 'Style',
    painter: 'Painter',
    likes: 'Tap likes to light up the town',
    hangHere: 'Your portrait hangs here',
    idle: 'to get your portrait',
    show: ['Ta-da!', 'All done!', 'Like it?', 'Masterpiece!', 'Up it goes!', 'Looking good!', 'Spot on!'],
  },
};

// Câu MC ở bản tiếng Anh (bản Việt dùng các câu trong GAME bên dưới). Tên kênh không đọc ở bản này.
export const EN_LINES = {
  greeting: (names: string, _kenh: string, more = 0) => (more > 0 ? `Welcome ${names} and ${more} more friends!` : `Welcome ${names}!`),
  thankGift: (name: string, gift: string, _kenh: string) => `Thank you ${name} for the ${gift}!`,
  giftWishes: ['Have a wonderful day!', 'Wishing you a lucky week!', 'Hope everything goes your way!'],
  thankFollow: (name: string, _kenh: string) => `Thanks for the follow, ${name}!`,
  shareWithNames: (names: string, _kenh: string) => `Thanks for hanging out, ${names}. Share the live so your friends can get drawn too!`,
  shareLines: ['Enjoying the show? Share the live with your friends!', 'More friends, more portraits. Tap share and bring them in!'],
  idleLines: ['Want your portrait? Just comment draw me!', 'Comment draw me and our painter will draw you!', 'Tap those likes to light up the lanterns!'],
  boostLine: 'Likes are full. Lanterns on!',
  giftPriority: (name: string) => `${name}, you are up right after this one!`,
  finishLines: [
    (name: string) => `Here is your portrait, ${name}!`,
    (name: string) => `All done, ${name}. Up on the line it goes!`,
    (name: string) => `${name}, your portrait is ready. Next in line, get ready!`,
  ],
  painterLine: (painter: string) => `Shift change! ${painter} takes over the brush.`,
};

export const GAME = {
  title: 'XƯỞNG VẼ PHỐ HỘI',
  subtitle: 'Comment “vẽ tôi” để được vẽ chân dung',

  // Tên kênh mặc định, tới khi chủ kênh lưu tên ở trang điều khiển
  defaultChannelName: 'kênh mình',

  // Giọng MC mặc định khi chưa chọn ở trang điều khiển: 'M' = nam NamMinh, 'F' = nữ HoaiMy
  voice: 'M' as 'M' | 'F',

  maxQueue: 300, // hàng chờ tối đa (khu chờ chỉ hiện 32 người đầu, còn lại hiện "+N")
  paintersEvery: 5, // vẽ xong 5 bức thì đổi họa sĩ
  galleryMax: 6, // số tranh treo trên dây

  // ---------- Câu đọc riêng của xưởng vẽ ----------
  // Người tặng quà: được vẽ ngay sau bức đang vẽ
  giftPriority: (name: string) => `Bạn ${name} được vẽ ngay sau bức này nha.`,
  // Vẽ xong 1 bức (chỉ đọc khi MC đang rảnh, tránh dồn câu)
  finishLines: [
    (name: string) => `Tranh của bạn ${name} xong rồi, treo lên dây nè.`,
    (name: string) => `Bạn ${name} ơi, chân dung của bạn đây.`,
    (name: string) => `Xong bức của bạn ${name}. Người kế tiếp chuẩn bị nha.`,
  ],
  // Họa sĩ mới vào ca
  painterLine: (painter: string) => `Đổi ca rồi, họa sĩ ${painter} vào vẽ tiếp nè.`,

  // Điểm
  pointsPerComment: 1,
  pointsPerCoin: 10, // 1 xu quà = 10 điểm

  // Thanh tim: đủ số tim này thì kích hoạt hiệu ứng
  likesPerBoost: 500,
  boostSeconds: 30,

  // ---------- Chào người vào ----------
  greetEveryMs: 6000, // gom người mới, 6 giây chào 1 lượt
  namesPerGreeting: 3, // 3 tên mỗi câu
  // more > 0: phòng đông, gộp "chào bạn A, bạn B, bạn C và 25 bạn nữa"
  greeting: (names: string, kenh: string, more = 0) =>
    more > 0 ? `${kenh} chào ${names} và ${more} bạn nữa vừa vào chơi.` : `${kenh} chào ${names} vừa vào chơi.`,

  // ---------- Cảm ơn quà ----------
  // Cùng 1 người tặng liên tục / combo: chỉ cảm ơn 1 lần mỗi 30 giây. Quà từ 99 xu luôn được cảm ơn.
  giftThanksCooldownMs: 30_000,
  bigGiftCoins: 99,
  thankGift: (name: string, gift: string, kenh: string) => `${kenh} cảm ơn bạn ${name} đã tặng ${gift}.`,
  // Đọc thêm 1 câu chúc ngẫu nhiên sau lời cảm ơn quà ([] = không đọc)
  giftWishes: [
    'Chúc bạn một ngày thật vui.',
    'Chúc bạn làm gì cũng suôn sẻ nha.',
    'Chúc cả nhà bạn mạnh khỏe, bình an.',
    'Chúc bạn may mắn cả tuần luôn.',
  ],

  // ---------- Theo dõi kênh (mỗi người cảm ơn 1 lần) ----------
  thankFollow: (name: string, kenh: string) => `${kenh} cảm ơn bạn ${name} đã theo dõi kênh nha.`,

  // ---------- Comment có lời cầu chúc ----------
  // Ai comment kiểu "mong mai thi được điểm cao" thì đọc 1 câu chúc đúng chủ đề.
  // KHÔNG BAO GIỜ đọc nguyên văn comment. Mỗi người 1 lần / 10 phút, cả phòng tối đa 1 lần / 20 giây.
  wishPerUserMs: 10 * 60_000,
  wishGlobalMs: 20_000,
  wishReplies: {
    exam: [
      (name: string) => `Chúc bạn ${name} ôn bài vô đầu, vào phòng thi thật bình tĩnh, điểm cao như mong muốn.`,
      (name: string) => `Chúc bạn ${name} học đâu nhớ đó, thi đâu đậu đó.`,
    ],
    health: [
      (name: string) => `Chúc bạn ${name} với người nhà mau khỏe, ăn ngon ngủ yên.`,
      (name: string) => `Chúc nhà bạn ${name} ai cũng khỏe, người đang mệt thì sớm bình phục.`,
    ],
    love: [
      (name: string) => `Chúc bạn ${name} sớm gặp người thương mình thật lòng.`,
      (name: string) => `Chúc bạn ${name} chuyện tình cảm êm đẹp, thương ai người đó cũng thương lại.`,
    ],
    family: [
      (name: string) => `Chúc nhà bạn ${name} luôn êm ấm, cha mẹ khỏe, con cái ngoan.`,
      (name: string) => `Chúc gia đình bạn ${name} lúc nào cũng vui vẻ, thương nhau.`,
    ],
    work: [
      (name: string) => `Chúc bạn ${name} công việc thuận lợi, sớm được như ý.`,
      (name: string) => `Chúc bạn ${name} tìm được việc ưng ý, làm đâu thuận đó.`,
    ],
    wealth: [
      (name: string) => `Chúc bạn ${name} làm ăn phát đạt, buôn may bán đắt.`,
      (name: string) => `Chúc bạn ${name} tiền vô đều tay, nợ nần sớm xong.`,
    ],
    peace: [
      (name: string) => `Chúc bạn ${name} mọi chuyện bình an, thuận lợi.`,
      (name: string) => `Chúc bạn ${name} gặp nhiều may mắn, đi đâu cũng bình an.`,
    ],
  } as Record<WishTopic, ((name: string) => string)[]>,

  // ---------- Nhắc chia sẻ live ----------
  // Mỗi 5 phút; có người vừa tương tác thì cảm ơn tối đa 3 tên trước.
  shareReminderEveryMs: 5 * 60_000,
  shareWithNames: (names: string, kenh: string) =>
    `${kenh} cảm ơn ${names} đã ghé chơi. Mọi người nhớ bấm chia sẻ live cho bạn bè cùng vào nha.`,
  shareLines: [
    'Mọi người thấy vui thì bấm chia sẻ live cho bạn bè cùng vào chơi nha.',
    'Thêm người là thêm vui, cả nhà bấm chia sẻ live giúp kênh nhé.',
  ],

  // ---------- Live im quá lâu ----------
  // Giọng im quá 90 giây thì đọc 1 câu cho đỡ trống.
  idleAfterMs: 90_000,
  idleLines: [
    'Ai muốn có chân dung thì comment vẽ tôi nha, họa sĩ vẽ liền.',
    'Comment vẽ tôi hoặc draw me là được xếp hàng vẽ chân dung.',
    'Cả nhà thả tim cho đầy thanh, đủ tim là cả phố lên đèn.',
  ],

  boostLine: 'Đủ tim rồi, cả phố lên đèn!',
};
