# Vẽ Tranh Đường Phố: ghi chú cho Claude

> File này mô tả RIÊNG game này. Luật chung cho mọi game nằm ở `E:\VibeCode\CLAUDE.md` (Claude tự đọc cả hai).
> Khi chủ kênh chốt một quyết định (câu đọc, màu, font, luật chơi), ghi vào mục "Quyết định của chủ kênh".

## Ý tưởng

Họa sĩ đường phố vẽ chân dung cho người xem (10 nền: phố Hội, bãi biển, phố tuyết, phố neon...). Người xem comment "vẽ tôi" thì avatar vào hàng chờ, họa sĩ vẽ lại avatar thành tranh (phác nét trước, tô màu sau, khoảng 3 giây một bức), xong thì treo lên dây phía trên.
Cách chơi lấy ý từ một game xưởng vẽ trên TikTok mà chủ kênh gửi ảnh, nhưng bối cảnh, nhân vật, tên game đều tự làm, không chép lại game đó.

## Luật chơi

- Xin vẽ: bản Việt comment `vẽ tôi` (cả `vẽ mình`, `vẽ cho tôi`), bản Anh comment `draw me` (so sánh không dấu). Đang chờ hoặc đang được vẽ thì comment lại không tính thêm.
- Hàng chờ: tối đa 300 người, khu chờ hiện 32 người đầu (zíc zắc, người đầu ở góc sát họa sĩ), còn lại hiện "+N người đang chờ".
- Quà: người tặng được vẽ ngay sau bức đang vẽ, xếp sau những người tặng trước đó. Có viền vàng, sao, khung tranh vàng trên dây. MC cảm ơn và báo "được vẽ ngay sau bức này".
- Tim: đủ 500 tim thì đèn lồng sáng rực 30 giây.
- Mỗi bức chọn ngẫu nhiên 1 trong 10 phong cách (không lặp bức liền trước).
- Họa sĩ (10 người) và nền (10 nền, `BACKGROUNDS` trong Scene.tsx) do chủ kênh chọn ở trang điều khiển, giữ nguyên suốt buổi, không đổi ngẫu nhiên.
- Dây treo giữ 6 bức mới nhất, bức cũ rơi xuống.

## 6 câu hỏi thiết kế

1. Comment "vẽ tôi": trong 1 giây avatar bật vào hàng chờ, có số người chờ.
2. 500 người cùng comment: hàng chờ có trần 300, hiện 32, còn lại gộp "+N". MC không đọc từng người vào hàng, chỉ đọc khi xong tranh lúc rảnh.
3. Người không lên hình: thả tim cho phố lên đèn.
4. Ai được vẽ: vào trước vẽ trước, người tặng quà chen lên đầu. Mỗi bức ~5 giây (3 giây vẽ + 1,3 giây khoe + 0,5 giây nghỉ), khoảng 12 người/phút.
5. Người vào sau: comment là vào hàng ngay. Đông quá thì chờ lâu (300 người chờ ~25 phút).
6. Người tặng quà: MC đọc tên, viền vàng, tranh khung vàng có sao.

## File của game này

- `src/game/config.ts`: số liệu, câu đọc, từ khóa. Sửa nhỏ thì sửa ở đây trước.
- `src/game/useGame.ts`: luật chơi (xử lý chat, quà, tim, người vào).
- `src/game/GameStage.tsx`: màn hình trên live, khung 1080×1920.
- `src/game/portrait.ts`: bộ vẽ tranh. Dò nét từ avatar, 10 phong cách (`STYLES`), mặt hoạt hình tự sinh khi không có avatar.
- `src/game/Easel.tsx`: giá vẽ, chạy 1 phiên vẽ (phác nét, tô màu theo vệt cọ zíc zắc, khoe tranh), báo vị trí đầu cọ cho họa sĩ.
- `src/game/Painter.tsx`: 10 họa sĩ (`PAINTERS`) vẽ bằng SVG, tay cầm cọ chạy theo đầu cọ (IK 2 khớp), chớp mắt, thở, nghiêng người.
- `src/game/Scene.tsx`: nền phố Hội (nhà vàng, mái ngói, sông, cầu, đèn lồng, sân gạch, giá vẽ).
- `src/game/layout.ts`: vị trí giá vẽ, họa sĩ, hàng chờ, dây treo + nhịp vẽ (`TIMES`).
- `server.ts`: thêm `/api/avatar` lấy ảnh avatar TikTok qua server (canvas mới đọc được điểm ảnh). Chỉ cho host CDN TikTok.
- `src/live/`, `server.ts`: phần chung lấy từ `_base`, hạn chế sửa.

## Phần live dùng chung (có sẵn từ `_base`, game không cần làm lại)

- **Chống 2 giọng:** mỗi trang `?view=stage` có mã riêng (`STAGE_ID` trong `page.ts`), server giữ danh sách trang stage đang mở và báo qua sự kiện SSE `speaker`. Chỉ trang mở **sau cùng** phát tiếng, trang cũ tự im; đóng trang mới thì trang cũ nói lại. Trang điều khiển hiện cảnh báo đỏ khi có hơn 1 trang stage (`status.stages`).
- **MC tự gỡ kẹt:** đoạn nào 8 giây chưa phát được thì bỏ; đang phát quá độ dài đoạn + 4 giây thì cắt. Trình duyệt chặn tự phát tiếng thì thử lại 4 lần, mỗi lần cách 1,5 giây.
- **MC nói liền mạch:** đang đọc câu này thì tạo sẵn giọng câu kế; câu quà (ưu tiên) tạo sẵn ngay khi xếp hàng. Hàng ưu tiên (`voice.say(text, true)`) chờ tối đa 60 giây, hàng phụ (câu thường) 30 giây, quá thì bỏ.
- **Ký hiệu trong câu đọc** (viết trong `config.ts`):
  - `|` tách đoạn, ví dụ `'Trời ơi! | Bạn A lên top rồi'`
  - `^` ở đầu đoạn để hô to hơn (chỉ tăng âm lượng, không đổi cao độ), ví dụ `'^Hoan hô!'`
  - `M:` / `F:` cho 2 MC, nam NamMinh và nữ HoaiMy (`/api/tts?v=f`). Giọng giữ nguyên tới khi đổi. **Mặc định chỉ dùng 1 giọng nam**: câu không ghi gì là giọng nam.
- **Chọn giọng nam/nữ:** trang điều khiển có nút "Giọng MC" (lệnh `setVoice` M/F). Server nhớ trong `settings.json` và gửi lại cho trang mới mở. `GAME.voice` trong config.ts là giọng mặc định khi chưa chọn. Câu ghi `M:`/`F:` vẫn ép đúng giọng đó.
- **Giọng dự phòng:** Edge (NamMinh/HoaiMy) lỗi thì `/api/tts` tự chuyển sang giọng Google.
- **Live tự động** (`src/live/autoLive.ts`, khung Giả lập): chạy trọn 1 vòng với 10 / 50 / 100 người giả: vào phòng rải rác (có người vào muộn), comment, tim, quà nhỏ/vừa, 2 quà to, follow, share, 1 comment bậy. Game truyền `autoLive={{ durationMs, comment, onStart }}` vào `<Dashboard>` để comment đúng luật chơi và bắt đầu từ đầu vòng.
- **Cao độ giọng:** đặt biến môi trường `TTS_PITCH` (mặc định `-4%`) trong `.env` hoặc `BAT-LIVE.bat`, không cần sửa code.
- **Cổng tự lùi:** cổng 3000 bận (đang chạy game khác) thì server tự thử 3001, 3002… (tối đa 20 lần) và in rõ link điều khiển + link LIVE Studio đúng cổng vừa chọn. Cổng tự tải lại (HMR) từ 24680 cũng lùi như vậy. `BAT-LIVE.bat` để server tự mở đúng trang điều khiển. Nhớ: link trong LIVE Studio phải khớp cổng in ra.
- **Kết nối TikTok không treo:** hỏi TikTok xem tài khoản có đang live không trước, chưa live thì báo lỗi ngay; quá 30 giây chưa vào được phòng thì báo lỗi.

## Quyết định của chủ kênh

- 2026-11-24: Quà được ưu tiên vẽ ngay sau bức hiện tại (chủ kênh yêu cầu; khác với skill `tiktok-live-game` vốn cấm xử lý quà).
- 2026-11-24: Mỗi bức vẽ ~3 giây, phác nét xong mới tô màu. 10 phong cách, 10 họa sĩ.
- Trên màn hình không có chữ kêu gọi tặng quà.
- 2026-11-24: Trang điều khiển gói trong 1 khung dọc 1080×1920 (cột trái: kết nối, giọng, giả lập; cột phải: xem trước + chọn họa sĩ, nền).
- 2026-11-24: Cổng mặc định 3101 (cổng 3000 có game khác). Link LIVE Studio: `http://lvh.me:3101/?view=stage`.
- 2026-11-24: 2 bản, chọn ở trang điều khiển (khung "Bản game"): Tiếng Việt chỉ nhận và hiện "vẽ tôi", English chỉ nhận và hiện "draw me". Chữ trên màn hình đổi theo bản (`TEXT` trong config.ts). Bản English có MC tiếng Anh (giọng Edge en-US Guy / Jenny, câu trong `EN_LINES`), không đọc lời chúc theo comment.
