# ARCHITECTURE — goclaptrinh.io.vn

Bối cảnh kỹ thuật. Những thứ ở đây **ít thay đổi**, đọc để không phải khám phá lại. Nếu có quyết định mới, thêm vào cuối `## Quyết định kiến trúc`.

## Stack

Next.js 16 (App Router, Turbopack, `proxy.ts` thay vì `middleware.ts`) · React 19 · TypeScript · Tailwind · Drizzle ORM + better-sqlite3 · NextAuth (Credentials + TOTP) · Tiptap.

Dev chạy port **3002**. `README.md` còn ghi 3000 (sai).

## Cấu trúc

```
src/app/            routes: public + admin + api (51 route files)
src/components/admin/   admin UI      src/components/client/  public UI
src/components/shared/  Header, Footer, ThemeProvider
src/lib/            data access + auth + permissions + llm + analytics
src/lib/db/schema.ts   Drizzle schema (20 bảng)
src/lib/db/index.ts    ⚠ xem bên dưới
content/posts/      10 file markdown nguồn của bài viết
```

## ⚠ Sửa schema phải biết 2 chỗ

`src/lib/db/index.ts` **rất lớn và tự chạy DDL thô lúc boot** (tạo bảng, backfill cột, seed idempotent). Có nghĩa là:

1. Thêm cột/bảng mới → sửa **cả** `src/lib/db/schema.ts` **và** DDL trong `src/lib/db/index.ts`.
2. **Không có migration history** (`/drizzle/` bị gitignore). Đừng tạo migration mới trông như đang dùng Drizzle migrations.
3. Đừng refactor file này khi không được yêu cầu — rủi ro cao, phạm vi rộng.

## Phân quyền: đang có 2 nguồn (biết lỗi, xem P1-2)

- `users.role` — text slug, **không có foreign key** tới `roles`.
- `roles.permissions` — JSON array.
- Gate cấp trang: theo **tên role**. Gate API: theo **mảng permission** (`requireAuth([...])` trong `src/lib/permissions.ts`).

Hai cơ chế này có thể lệch nhau. Khi làm việc liên quan phân quyền, kiểm tra cả hai đầu.

## Auth

- `src/lib/auth.ts` — NextAuth Credentials, JWT session, role thêm trong session callback.
- `src/lib/credentials.ts` — bcrypt, rồi bắt buộc TOTP nếu `totpEnabled`.
- `src/proxy.ts` — Next.js 16 proxy. Redirect `/admin` chưa đăng nhập; chặn một số prefix API + method ghi của `/api/posts`, `/api/categories` ở edge.
- Route không có `error.tsx` → lỗi server ra trang trắng.

## API

Public: `GET/POST /api/search`, `/api/react`, `POST /api/track/view`, `GET /api/welcome`, `POST /api/welcome/submit`, `POST /api/newsletter/subscribe`, `GET /api/newsletter/unsubscribe`, `POST /api/auth/status`, `/api/auth/[...nextauth]`.

Chỉ cần session: `/api/comments`, `/api/comments/report`, `POST /api/courses/[courseId]/lessons/[lessonId]/progress`.

Còn lại: admin CRUD, mỗi handler tự gọi `requireAuth([...permissions])`.

## Lưu trữ phía client

| Loại | Tên | Mục đích |
|---|---|---|
| cookie | `next-auth.session-token` | đăng nhập — không cần consent |
| cookie | `admin_theme` | chống nháy trắng dark mode admin — không cần consent |
| localStorage | `goclaptrinh_visitor_id` | ID khách vĩnh viễn — **cần consent, đang chuyển sang cookie (P0-2)** |
| localStorage | `theme` | sở thích giao diện — không cần consent |
| localStorage | `welcome-seen-at` | đã xem popup chưa — không cần consent |
| sessionStorage | `pv_sent_*` | chống ghi trùng pageview |

Không có cookie/pixel bên thứ ba, không có mạng quảng cáo.

`PageViewTracker` nằm trong root layout, **bỏ qua `/admin`**, chạy vô điều kiện → sẽ phải check consent (P0-4).

## Tiện ích có sẵn — đừng viết lại

`src/lib/sanitize.ts` (rewrite YouTube embed sang `youtube-nocookie.com` + sanitize HTML) · `src/lib/rate-limit.ts` (`welcomeLimiter`) · `src/lib/visitor.ts` (`getClientIp`, `normalizeSignals`, `computeFingerprint`) · `src/lib/client-visitor.ts` (`getVisitorId`, `getVisitorSignals`).

## Quy ước code

- Tiếng Việt cho text hiển thị và message lỗi trả về client; tiếng Anh cho comment code.
- Comment trong code là tiếng Việt, giải thích **tại sao** chứ không phải **làm gì**.
- Xác thực input ngay trong handler API, trả `NextResponse.json` — không để ném lỗi ra ngoài.
- Honeypot field `website` + rate limit cho mọi form public.

---

## Quyết định kiến trúc

*Ghi ngày, quyết định, và lý do.*

| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-09-26 | Tạo `docs/ROADMAP.md` + `docs/ARCHITECTURE.md` làm nguồn trí nhớ cho AI, ép nạp qua `opencode.json.instructions` | AI không có trí nhớ giữa phiên; chỉ file trong repo là bền vững |
| 2026-09-26 | Che IP ở **tầng data** (`rowTo*` trong `chat.ts`/`comments.ts`/`audit.ts`), không che ở UI | UI thì dễ sót chỗ; che ở mapper thì IP gốc không bao giờ rời khỏi server. Đã bắt được 3 chỗ sót khi kiểm tra lại: `detail.ip` trong audit, `...s` trong welcome-submissions, và `rowToComment` dùng chung cho cả công khai lẫn admin |
| 2026-09-26 | IP gốc vẫn lưu **plaintext** tới hết retention, chỉ che lúc đọc ra | Che lúc ghi thì mất khả năng điều tra spam; giữ nguyên ở tầng data vẫn an toàn vì không có đường nào đọc thô ra ngoài |
| 2026-09-26 | Retention chạy trong `src/instrumentation.ts`, **không** gọi trong `src/lib/db/index.ts` | `db/index.ts` import retention tạo vòng import; `retention.ts` cần `db`, và `db/index.ts` tự gọi hàm của nó lúc module đang khởi tạo → `sqliteClient` chưa gán xong. Đã thử 2 cách đều hỏng, chuyển sang instrumentation |
| 2026-09-26 | Throttle retention bằng mốc thời gian lưu trong `settings` (24 giờ), không dùng cron | Đủ cho app quy mô này và không cần hạ tầng mới. Nếu cần cron thật thì xem lại P6-1 |
| 2026-09-26 | Chính sách lưu trong `settings` key `policy_pages` (JSON), **không** thêm bảng mới | Chính sách là nội dung site, không cần query/lọc/join; tránh thêm schema + migration vào `db/index.ts` vốn đã khó refactor |
| 2026-09-26 | `DB_PATH` trong `src/lib/db/index.ts` chỉ để test trên DB tạm | Cần kiểm thử retention mà không đụng dữ liệu thật. Hook đọc `process.env`, ưu tiên cho biến môi trường nên vẫn dùng được bình thường |
| 2026-09-26 | Chat admin ẩn IP + thiết bị mặc định, mở qua nút "Thông tin kỹ thuật" | IP chỉ hữu ích khi điều tra nghi vấn spam, hiện thường xuyên lại gây lo ngại quyền riêng tư vô lý do. Ẩn mặc định giữ được cả hai; dữ liệu vẫn gửi tới admin sau khi bấm |
