# ROADMAP — goclaptrinh.io.vn

Nguồn trí nhớ duy nhất cho các phiên làm việc với AI. **Đọc file này trước khi code.**

## Cách dùng

- Muốn làm **việc kế tiếp theo ưu tiên** → gõ `/lam-tiep`.
- Muốn làm **đúng một việc, bỏ qua thứ tự** → gõ `/viec <mã>` hoặc `/viec <mô tả>`, ví dụ `/viec P4-1`, `/viec Sửa README`.
- Muốn **làm thứ chưa có trong danh sách** → nói thẳng, AI sẽ đề xuất thêm mục mới vào đây trước khi code.

Sau khi làm xong, AI **phải** tick `[x]` và ghi quyết định vào `docs/ARCHITECTURE.md`.

Mỗi mục có mã ổn định (`P0-1`, `P3-2`...). **Đừng đánh số lại** khi thêm/xoá mục — mã cũ được dùng để tra cứu nên phải giữ nguyên.

Nguyên tắc ưu tiên: P0 (pháp lý) → P1 (lỗ hổng logic) → P2 (tài khoản) → P3 (tiền) → P4 (SEO) → P5 (UX) → P6 (vận hành).

---

## P0 — Pháp lý & cookie

Bối cảnh: dự án **không** dùng cookie/pixel bên thứ ba, nhưng `PageViewTracker` gửi path, referrer, visitorId, **IP**, userAgent, timezone, kích thước màn hình. IP + hành vi là dữ liệu cá nhân theo NĐ 13/2023 + Luật ATTT 2015.

- [ ] **P0-1** Trang `/privacy` — liệt kê dữ liệu thu thập, mục đích, thời hạn lưu, bên kiểm soát, cách yêu cầu xoá. `src/app/privacy/page.tsx` (chưa có)
- [ ] **P0-2** Chuyển visitor ID từ `localStorage` sang **cookie first-party** (`SameSite=Lax`, `Max-Age=31536000`). Sửa `src/lib/client-visitor.ts` (đang dùng `goclaptrinh_visitor_id` trong localStorage). Lý do: nút "Xóa dữ liệu cookie" của trình duyệt **không xoá được localStorage** → dù user xoá, ID vẫn còn và vẫn bị nhận diện.
- [ ] **P0-3** Component `src/components/client/CookieConsent.tsx` — chỉ **2 mức** (Bắt buộc luôn bật / Đo lường **mặc định TẮT**). Không dùng cookie quảng cáo nên không cần mức 3. Không dùng pattern "chấp nhận" là mặc định.
- [ ] **P0-4** Consent **phải thực sự chặn** tracker, không chỉ ẩn UI: check cờ trước khi fetch ở `src/components/client/ui/PageViewTracker.tsx:20`, và chặn phần gửi `signals`/`visitorId` trong `src/components/client/welcome/WelcomeDialog.tsx` + form newsletter.
- [ ] **P0-5** Công tắc bật/tắt banner + sửa nội dung text trong `/admin/settings` (dùng `settings` table, `AdminSettings.tsx`).
- [ ] **P0-6** Link `/privacy` (và `/terms` nếu có) ở `src/components/shared/Footer.tsx`. *Hiện footer đã trỏ `/chinh-sach`, nhưng chưa có trang `/privacy` cụ thể (xem P0-1).*
- [x] **P0-7** Che dữ liệu cá nhân **ở tầng data, không phải ở UI** — `src/lib/privacy.ts` (`maskIp()`), áp cho chat, audit, welcome. Vá rò rỉ `GET /api/comments` từng trả IP + signals thô cho người chưa đăng nhập, và `detail.ip` lách qua `maskIp` ở `/admin/audit`. IP gốc vẫn lưu plaintext tới hết retention.

## P1 — Lỗ hổng logic & bảo mật

- [ ] **P1-1** **Chặn truy cập bài học trả phí.** `src/lib/courses.ts:145` tự tạo `course_enrollments` cho bất kỳ email nào khi đánh dấu hoàn thành bài đầu tiên → ai đăng nhập cũng học được kể cả khóa có `price > 0`. Cần cổng kiểm tra enrollment ở `src/app/courses/[slug]/[lessonSlug]/page.tsx`. *Phụ thuộc P3 nếu muốn bán thật.*
- [ ] **P1-2** **Gộp phân quyền còn 1 nguồn.** `users.role` (text slug) và `roles.permissions` (JSON array) không có foreign key; gate cấp trang theo *tên role* còn gate API theo *mảng permission* (`src/lib/permissions.ts`, `src/components/admin/AdminSidebar.tsx`). Sửa `/admin/roles` không chắc UI cập nhật.
- [ ] **P1-3** Thêm `src/app/error.tsx` (global error boundary) — hiện lỗi server ra trang trắng.
- [ ] **P1-4** Chống spam: blocklist IP/visitorId + rate-limit theo từng bài viết. Nền có sẵn ở `src/lib/rate-limit.ts`, `src/lib/visitor.ts`.

## P2 — Tài khoản người dùng

Hiện chỉ có `/login`. Admin phải tạo user tay (`src/components/admin/users/UserManager.tsx:270`).

- [ ] **P2-1** `/register` — đăng ký bằng email + mật khẩu, validate, rate-limit.
- [ ] **P2-2** `/forgot-password` + `/reset-password` — token một lần, hạn dùng, gửi email qua provider trong `ai_providers`-style setting.
- [ ] **P2-3** `/profile` — đổi email, đổi mật khẩu, bật/tắt MFA. API `/api/admin/mfa` hiện chỉ cho admin — cần nhánh user.
- [ ] **P2-4** Trang `/my-courses` — khóa đã đăng ký + tiến độ.
- [ ] **P2-5** Admin: xem user đăng ký khóa nào, khóa tài khoản.

## P3 — Thương mại khóa học

`courses.price` đã tồn tại và hiển thị giá nhưng **chưa có** checkout, đơn hàng, payment, coupon, affiliate. `course_enrollments` là bảng duy nhất liên quan và đang bị dùng sai (xem P1-1).

- [ ] **P3-1** Bảng `orders` + `order_items` + `payments` (thêm vào `src/lib/db/schema.ts` **và** DDL boot-time trong `src/lib/db/index.ts`).
- [ ] **P3-2** Tích hợp cổng thanh toán (MoMo / VNPay / Stripe) + webhook có xác thực chữ ký.
- [ ] **P3-3** UI checkout + lịch sử đơn hàng + trạng thái thanh toán.
- [ ] **P3-4** Mã giảm giá / affiliate (khớp với thư mục repo `Affiliate`).
- [ ] **P3-5** Hoá đơn điện tử + hoàn tiền.
- [ ] **P3-6** Admin: `/admin/orders` — duyệt, hoàn tiền, đối soát.

## P4 — SEO & nội dung

- [ ] **P4-1** Thêm `metaDescription`, `ogImage`, `canonical` cho `posts` (bảng `posts` hiện **không có** trường nào trong 3 loại này).
- [ ] **P4-2** Preview social + cập nhật `src/app/sitemap.ts`, `src/app/rss.xml`.
- [ ] **P4-3** Draft / hẹn giờ đăng + link xem trước bài.
- [x] **P4-4** Trang pháp lý động trong `settings`. Đã có `src/lib/policy.ts` (key `policy_pages`) + admin `/admin/policy` + public `/chinh-sach`, `/chinh-sach/[slug]`, slug tự do, chỉ super-admin. **Còn lại:** `/about` vẫn hardcode, chưa có `/contact`.
- [ ] **P4-5** Redirect 301 khi đổi slug (giữ link cũ).

## P5 — Trải nghiệm client

- [ ] **P5-1** Bookmark/save bài + lịch sử đọc + "đọc tiếp".
- [ ] **P5-2** `/search`: autocomplete, tìm trong khóa học, lọc theo thời gian/độ khó.
- [ ] **P5-3** Bình luận: sửa/xoá comment của mình, phân trang, reply markdown.
- [ ] **P5-4** Trang `/contact` — dùng chung honeypot + rate-limit đã có ở welcome/newsletter.
- [ ] **P5-5** Giao diện quản lý newsletter phía user (API `unsubscribe` đã có, chưa có UI).
- [ ] **P5-6** Trang lỗi/404 đẹp (`src/app/not-found.tsx` có sẵn, chưa có `error.tsx` — xem P1-3).
- [x] **P5-7** Chat 1-1 client ↔ admin — widget nhúng, hội thoại, trả lời trong `/admin/chat`, phân quyền, audit, rate-limit. Admin **không** dùng SSE, polling 5 giây và tự dừng khi tab ẩn. IP + thiết bị ẩn mặc định, mở ở nút "Thông tin kỹ thuật".

## P6 — Vận hành

- [ ] **P6-1** Auto-backup theo lịch + retention + upload lên S3/GDrive. Hiện chỉ có create/restore thủ công. `data/` bị gitignore → mất là mất.
- [ ] **P6-2** Retention/purge cho `page_views` và `welcome_submissions`. **Một nửa:** `page_views` đã anonymize IP + signals sau 365 ngày (xem P6-6). **`welcome_submissions` chưa làm** — vẫn tích luỹ IP + signals vô hạn.
- [ ] **P6-3** Bulk actions cho posts / media / users (publish, xoá, chuyển category, gán tag).
- [ ] **P6-4** Export CSV báo cáo analytics.
- [ ] **P6-5** Sửa `README.md` (còn là template create-next-app, ghi sai port 3000 trong khi dev chạy 3002) + bổ sung tài liệu kiến trúc.
- [x] **P6-6** Retention cho chat — `chat_conversations` đã đóng >90 ngày thì anonymize `ip` + `signals` (giữ nội dung, hồ sơ, tin nhắn); `chat_rate_limits` >2 giờ thì xoá.
- [x] **P6-7** Chạy retention tự động — `src/lib/retention.ts` + `src/instrumentation.ts` (`register()`, chỉ Node runtime, throttle 24 giờ bằng `settings` key) + script thủ công `npm run db:retention`. Hook `DB_PATH` trong `src/lib/db/index.ts` chỉ để test trên DB tạm.
- [ ] **P6-8** 6 bảng `*_rate_limits` còn lại lưu **IP thuần** làm khoá (`rate-limit.ts` không hash), giữ vô hạn, không ai dọn. Cần chốt thời hạn lưu + cân nhắc hash khoá. Liên quan P1-4.

---

## Mục mới

Thêm mục mới vào cuối nhóm phù hợp, kế từ mã cuối cùng. Ghi ngày và ghi lý do nếu thay đổi thứ tự ưu tiên.

| Ngày | Mã | Mô tả | Vì sao thêm |
|---|---|---|---|
| 2026-09-26 | P0-7 | Che dữ liệu cá nhân ở tầng data + vá rò rỉ IP ở API công khai | Roadmap chỉ nói IP là dữ liệu cá nhân (P0-1) nhưng không có mục nào cho việc chặn rò rỉ ở tầng response. Phát hiện khi làm chat: `GET /api/comments` trả IP + signals thô cho người chưa đăng nhập |
| 2026-09-26 | P5-7 | Chat 1-1 client ↔ admin | Tính năng đã có trong repo nhưng roadmap không có mục chat nào, nên các phiên sau không biết là đã làm hay chưa |
| 2026-09-26 | P6-6 | Retention cho `chat_conversations` + `chat_rate_limits` | P6-2 chỉ nói `page_views` + `welcome_submissions`; chat tích luỹ IP + signals mà không ai dọn |
| 2026-09-26 | P6-7 | Retention chạy tự động lúc boot + script thủ công | P6-1 nói auto-backup theo lịch nhưng chưa có; retention cần chạy được thật chứ không chỉ có hàm |
| 2026-09-26 | P6-8 | IP thô trong 6 bảng `*_rate_limits` không được dọn | Phát hiện khi audit rate-limit; để `[ ]` vì còn chưa chốt chính sách thời hạn lưu |
