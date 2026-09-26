/**
 * Chạy đúng một lần khi Next.js khởi động server.
 *
 * Retention đặt ở đây thay vì trong `lib/db/index.ts` để tránh import vòng: file
 * đó tự gọi `maybeAutoBackup()` lúc module khởi tạo, nên nếu nó cũng gọi
 * `runRetention()` thì thứ tự nạp module quyết định job có chạy hay không.
 * Ở đây chỉ còn một chiều: instrumentation -> retention -> db.
 */
export function register() {
  // Edge runtime không có better-sqlite3.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Import động để không kéo better-sqlite3 vào bundle của Edge runtime.
  void import("@/lib/retention")
    .then(({ runRetention }) => runRetention())
    .catch((err) => console.error("Retention failed", err));
}
