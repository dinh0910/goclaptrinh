<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Bộ nhớ dự án — đọc TRƯỚC khi code

- `docs/ROADMAP.md` — backlog. Đọc để biết đang làm gì và đã làm gì.
- `docs/ARCHITECTURE.md` — bối cảnh kỹ thuật, quy ước code, các cái bẫy đã biết.

Quy tắc bắt buộc:

1. **Nếu người dùng nêu đích danh một việc** (mã `P0-1`, `/viec ...`, hoặc mô tả bằng lời) → làm đúng việc đó. Tuyệt đối không tự chọn việc khác. Thứ tự ưu tiên trong ROADMAP chỉ là mặc định khi người dùng không chỉ định.
2. Nếu việc yêu cầu không có trong ROADMAP → nói ra, đề xuất mục mới, hỏi trước khi code.
3. Sau khi xong và đã kiểm tra: tick `[x]` trong ROADMAP, và nếu có quyết định kỹ thuật mới thì thêm vào `## Quyết định kiến trúc` trong ARCHITECTURE.md.
4. Không đánh số lại các mã mục đã có — mã được dùng để tra cứu giữa các phiên.
5. Không tự ý thêm tính năng ngoài phạm vi đã bàn. Ghi vào "Mục mới" trong ROADMAP nếu thấy đáng làm.

Cạm bẫy đã biết, phải đọc `docs/ARCHITECTURE.md` trước khi sửa schema hoặc phân quyền.
