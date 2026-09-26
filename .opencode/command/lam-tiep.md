---
description: Làm mục đầu tiên còn [ ] trong ROADMAP, theo thứ tự ưu tiên P0 → P6.
agent: build
---

Đọc `docs/ROADMAP.md` và `docs/ARCHITECTURE.md` trước.

Tìm mục `[ ]` đầu tiên theo thứ tự ưu tiên P0 → P6; trong cùng nhóm thì theo số tăng dần.
Nếu mục đó đang bị chặn bởi mục chưa làm, nói rõ phụ thuộc rồi dừng lại hỏi.

Trước khi code, báo lại ngắn gọn:
- Mã + tên mục đang làm
- File sẽ tạo / sửa
- Rủi ro hoặc điểm cần tôi xác nhận

Sau khi xong và đã kiểm tra (lint + build):
1. Tick `[x]` trong `docs/ROADMAP.md`
2. Có quyết định kỹ thuật mới thì thêm vào `## Quyết định kiến trúc` trong `docs/ARCHITECTURE.md`
3. Báo những mục liên quan có thể làm tiếp
