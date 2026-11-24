// Vị trí các thứ trên stage 1080x1920 + nhịp vẽ 1 bức. Sửa bố cục thì sửa ở đây.

export const CANVAS = { x: 566, y: 800, size: 380 }; // khung tranh trên giá vẽ
export const PAINTER = { x: 318, y: 790, w: 340, h: 700 }; // hộp chứa họa sĩ
export const QUEUE = { x: 26, y: 790, cols: 4, rows: 8, gap: 70 }; // khu xếp hàng: 32 chỗ
export const STRING_Y = 300; // dây treo tranh

// Nhịp 1 bức (ms): phác nét -> tô màu (cộng lại ~3 giây) -> khoe tranh
export const TIMES = { line: 1400, color: 1700, show: 1300 };

/** Vị trí đầu cọ (toạ độ stage), giá vẽ ghi, họa sĩ đọc mỗi khung hình */
export interface Brush {
  x: number;
  y: number;
  mode: 'idle' | 'line' | 'color' | 'show';
  color: string;
}
