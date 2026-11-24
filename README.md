# Vẽ Tranh Đường Phố

Game tương tác cho TikTok LIVE. Người xem comment "vẽ tôi" (bản tiếng Anh: "draw me") là avatar vào hàng chờ. Tới lượt, họa sĩ trên màn hình phác nét chì theo khuôn mặt trong avatar, tô màu, rồi treo bức chân dung lên dây phía trên.

Màn hình dọc 1080×1920, chạy trên web, đưa lên live bằng nguồn Link của TikTok LIVE Studio. Game miễn phí, không thu tiền.

## Cách chơi

- **Comment "vẽ tôi":** Vào cuối hàng chờ. Đang chờ thì comment thêm không đổi chỗ. Vẽ xong muốn vẽ lại thì comment tiếp.
- **Hàng chờ:** Khu chờ hiện 32 người đầu, còn lại hiện "+N người đang chờ".
- **Mỗi bức khoảng 3 giây:** Phác nét chì, tô màu, rồi đặt ảnh avatar gốc lên giá và treo lên dây. Dây giữ 6 bức mới nhất.
- **Thả tim:** Đầy thanh 500 tim thì đèn lồng sáng rực 30 giây.

## Trang điều khiển

Trang điều khiển nằm gọn trong một khung dọc 1080×1920:

- **Bản game:** Tiếng Việt (chỉ nhận và nói "vẽ tôi") hoặc English (chỉ nhận và nói "draw me", MC tiếng Anh). Chọn bản nào thì cả live dùng một thứ tiếng.
- **10 họa sĩ, 10 nền:** Bấm chọn trước khi live, giữ nguyên suốt buổi. Nền có phố Hội chiều, phố Hội đêm, chợ hoa Tết, bãi biển, đồng lúa, vườn hoa, phố tuyết, phố đêm neon, làng tre, xưởng trong nhà.
- **Âm thanh và MC:** Nhạc nền nhẹ (tạo bằng code), tiếng bút vẽ, tốc độ giọng, mức MC nói chuyện (Ít, Vừa, Nhiều).
- **Tải lại trang live:** Bấm sau khi sửa code hoặc bật lại `BAT-LIVE.bat`, trang trong LIVE Studio tự lấy bản mới.

MC gọi tên người vào hàng vẽ trước, chào người vào live khi rảnh. Đông thì gộp thành một câu ("chào bạn A, bạn B, bạn C và 37 bạn nữa"). Không bao giờ đọc nguyên văn comment.

## Chạy

1. Cài [Node.js](https://nodejs.org) bản LTS (một lần).
2. Bấm đúp `BAT-LIVE.bat`. Lần đầu tự cài thư viện 1–2 phút, xong tự mở trang điều khiển `http://localhost:3101`.
3. TikTok LIVE Studio: Thêm nguồn **Link** `http://lvh.me:3101/?view=stage`, kích thước 1080 × 1920.
4. Bấm phát trực tiếp, nhập username vào trang điều khiển, bấm Kết nối.

Chưa live mà muốn thử: Dùng các nút **Giả lập** và **Live tự động** ở trang điều khiển.

Giữ cửa sổ `BAT-LIVE.bat` mở suốt buổi live. Chỉ trang stage phát tiếng. Đừng mở link `?view=stage` ở chỗ khác khi đang live, sẽ bị 2 giọng.

## Lưu ý trước khi dùng

- Game đọc comment qua thư viện `tiktok-live-connector`, **không phải công cụ chính thức của TikTok**. Dùng nó có thể trái điều khoản TikTok và có rủi ro bị khoá tài khoản. Bạn tự chịu rủi ro này, nên thử bằng tài khoản phụ trước.
- Game chỉ hiện tên và avatar công khai trong lúc live, không lưu lại dữ liệu người xem.
- Thông tin trên chỉ để tham khảo, không phải tư vấn pháp lý.

## Giấy phép

Mã nguồn: MIT. Hình và nhạc tự làm: CC BY 4.0. Âm thanh của bên thứ ba ghi trong `CREDITS.md`.
