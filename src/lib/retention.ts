import { sqliteClient } from "./db";

/**
 * Job dọn dữ liệu: bỏ dữ liệu cá nhân theo thời gian, giữ lại thứ còn dùng được.
 *
 * Nguyên tắc là tách "hồ sơ kinh doanh" khỏi "metadata kỹ thuật": nội dung chat,
 * họ tên, email, số điện thoại là thứ vận hành còn cần nên giữ; IP và dấu vân
 * thiết bị thì không, và cứ tích tụ vô hạn theo thời gian.
 *
 * Dự án không có migration history nên job này chạy lúc boot qua
 * `src/instrumentation.ts`, cùng lúc với `maybeAutoBackup()`.
 */

// Hội thoại chat đã đóng quá 90 ngày: bỏ IP + thiết bị, giữ nội dung và thông tin
// liên hệ.
const CHAT_RETENTION_DAYS = 90;

// page_views: giữ nguyên lượt xem/visitor/path để /admin/analytics còn dữ liệu dài
// hạn, chỉ bỏ IP + thiết bị. 365 ngày nên không cắt bất kỳ dữ liệu nào đang có.
const PAGEVIEW_RETENTION_DAYS = 365;

// Bảng rate limit chỉ cần nhớ quá khứ ngắn để chống flood.
const RATE_LIMIT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

const RETENTION_LAST_KEY = "retention_last";
const RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface RetentionResult {
  chatsAnonymized: number;
  pageViewsAnonymized: number;
  rateLimitRowsDeleted: number;
}

function getSetting(key: string): string | null {
  const row = sqliteClient
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

function setSetting(key: string, value: string) {
  sqliteClient
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
}

/** created_at / updated_at đều là ISO UTC nên so sánh chuỗi là so sánh thời gian. */
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/**
 * Chạy retention. Mặc định tự bỏ qua nếu đã chạy trong 24h qua; `force` để chạy tay.
 * Trả về `null` khi bị bỏ qua hoặc lỗi — không bao giờ ném ra ngoài để làm hỏng boot.
 *
 * Chỉ `instrumentation.ts` gọi hàm này, nên không có import vòng với `lib/db`.
 */
export function runRetention(force = false): RetentionResult | null {
  try {
    if (!force) {
      const last = Number(getSetting(RETENTION_LAST_KEY) || 0);
      if (last && Date.now() - last < RETENTION_INTERVAL_MS) return null;
    }

    const job = sqliteClient.transaction((): RetentionResult => {
      // Chỉ anonymize hội thoại đã đóng: hội thoại đang mở luôn giữ đủ thông tin
      // để người vận hành còn cần tra cứu.
      const chatsAnonymized = sqliteClient
        .prepare(
          `UPDATE chat_conversations
              SET ip = '', signals = '{}'
            WHERE status = 'closed'
              AND updated_at != ''
              AND updated_at < ?
              AND (ip != '' OR signals != '{}')`
        )
        .run(daysAgoIso(CHAT_RETENTION_DAYS)).changes;

      const pageViewsAnonymized = sqliteClient
        .prepare(
          `UPDATE page_views
              SET ip = '', signals = '{}'
            WHERE created_at < ?
              AND (ip != '' OR signals != '{}')`
        )
        .run(daysAgoIso(PAGEVIEW_RETENTION_DAYS)).changes;

      const rateLimitRowsDeleted = sqliteClient
        .prepare("DELETE FROM chat_rate_limits WHERE window_start < ?")
        .run(Date.now() - RATE_LIMIT_MAX_AGE_MS).changes;

      return { chatsAnonymized, pageViewsAnonymized, rateLimitRowsDeleted };
    });

    const result = job();
    setSetting(RETENTION_LAST_KEY, String(Date.now()));

    const { chatsAnonymized, pageViewsAnonymized, rateLimitRowsDeleted } = result;
    if (chatsAnonymized || pageViewsAnonymized || rateLimitRowsDeleted) {
      console.log(
        `Retention: ${chatsAnonymized} chat, ${pageViewsAnonymized} page view, ` +
          `${rateLimitRowsDeleted} rate limit đã dọn`
      );
    }
    return result;
  } catch (err) {
    console.error("Retention failed", err);
    return null;
  }
}
