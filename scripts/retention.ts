import { runRetention } from "../src/lib/retention";

// `force = true` bỏ qua bộ đếm 24h, dùng khi bạn muốn dọn ngay.
const result = runRetention(true);

if (!result) {
  console.error("Retention chạy lỗi, xem log ở trên.");
  process.exit(1);
}

console.log(
  `Xong: ${result.chatsAnonymized} hội thoại chat, ` +
    `${result.pageViewsAnonymized} page view, ` +
    `${result.rateLimitRowsDeleted} dòng rate limit đã dọn.`
);
