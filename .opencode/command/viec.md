---
description: Làm đúng một việc theo mã ROADMAP, bỏ qua thứ tự ưu tiên. Ví dụ: /viec P4-1
agent: build
---

Đọc `docs/ROADMAP.md` và `docs/ARCHITECTURE.md` trước.

Việc cần làm: $ARGUMENTS

Cách chọn:
- Nếu là **mã mục** (ví dụ `P0-2`) → làm đúng mục đó. Tuyệt đối không tự chọn mục khác.
- Nếu là **mô tả tự do** (ví dụ `sửa lại trang đăng nhập`) → tìm mục phù hợp nhất trong ROADMAP, nêu lại mã mục đã chọn và tiến trình bị ảnh hưởng. Nếu không có mục nào khớp, đề xuất mục mới để thêm vào ROADMAP rồi hỏi tôi trước khi code.
- Nếu có **nhiều mục khớp** → liệt kê ra và hỏi tôi chọn, đừng tự quyết.

Thứ tự ưu tiên trong ROADMAP **không áp dụng** khi dùng lệnh này.

Trước khi code, báo lại ngắn gọn: mã + tên mục, file sẽ tạo/sửa, rủi ro cần xác nhận.

Sau khi xong và đã kiểm tra (lint + build):
1. Tick `[x]` trong `docs/ROADMAP.md`
2. Có quyết định kỹ thuật mới thì thêm vào `## Quyết định kiến trúc` trong `docs/ARCHITECTURE.md`
3. Nếu làm lệch khỏi thứ tự đã lên kế hoạch, ghi chú lý do vào mục tương ứng
4. Báo những mục liên quan có thể làm tiếp
