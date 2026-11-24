// Tự kiểm tra Pending: npx tsx src/game/announcer.check.ts
import assert from 'node:assert/strict';
import { Pending } from './announcer';

const p = new Pending(20_000, true);
p.add('a', 'An', 0);
p.add('a', 'An', 1); // trùng: bỏ
p.add('b', 'bạn', 2); // tên không đọc được: vẫn đếm
assert.deepEqual(p.take(3, 10), { names: ['An'], more: 1 });
p.add('a', 'An', 20); // đã chào rồi (once): không chào lại
assert.equal(p.take(3, 30), null);

// đông: 3 tên mới nhất + đếm phần còn lại
const q = new Pending(20_000, false);
for (let i = 0; i < 50; i++) q.add(`u${i}`, `Tên ${i}`, 0);
assert.deepEqual(q.take(3, 100), { names: ['Tên 47', 'Tên 48', 'Tên 49'], more: 47 });

// quá hạn: bỏ
q.add('x', 'X', 0);
assert.equal(q.take(3, 25_000), null);

// vào hàng nhiều lần (once = false): lần nào cũng báo
q.add('x', 'X', 30_000);
assert.deepEqual(q.take(3, 30_001), { names: ['X'], more: 0 });
console.log('announcer ok');
