// Danh sách tên chờ MC đọc (chào người vào, báo người vào hàng vẽ).
// Đông thì gộp: đọc vài tên mới nhất + "và N bạn nữa". Chờ quá lâu thì bỏ (chuyện đã cũ).
// Tên không đọc được ('bạn') không bị bỏ qua: được tính vào phần "N bạn nữa".

export class Pending {
  private list: { key: string; name: string; at: number }[] = [];
  private seen = new Set<string>();

  /** once = true: mỗi người chỉ được đọc 1 lần cả buổi (chào); false: lần nào cũng được (vào hàng) */
  constructor(
    private maxAgeMs: number,
    private once: boolean,
    private max = 300,
  ) {}

  add(key: string, name: string, now = Date.now()) {
    if (this.once && this.seen.has(key)) return;
    this.seen.add(key);
    if (this.list.some((x) => x.key === key)) return;
    this.list.push({ key, name, at: now });
    if (this.list.length > this.max) this.list.shift();
  }

  remove(key: string) {
    this.list = this.list.filter((x) => x.key !== key);
  }

  get size() {
    return this.list.length;
  }

  /** Lấy 1 lượt đọc: tối đa `perBatch` tên đọc được mới nhất, còn lại đếm vào `more`. Trả null nếu không còn ai. */
  take(perBatch: number, now = Date.now()): { names: string[]; more: number } | null {
    this.list = this.list.filter((x) => now - x.at < this.maxAgeMs);
    if (!this.list.length) return null;
    const names = this.list
      .filter((x) => x.name !== 'bạn')
      .slice(-perBatch)
      .map((x) => x.name);
    const more = this.list.length - names.length;
    this.list = [];
    return { names, more };
  }

  reset() {
    this.list = [];
    this.seen.clear();
  }
}
