---
title: "TypeScript cho người mới bắt đầu"
description: "Học TypeScript từ cơ bản đến nâng cao với các ví dụ thực tế."
date: "2025-01-20"
category: "Backend"
tags: ["TypeScript", "JavaScript", "Lập trình"]
author: "Góc Lập Trình"
image: "/images/typescript-beginner.jpg"
featured: false
---

# TypeScript cho người mới bắt đầu

TypeScript là một ngôn ngữ lập trình được phát triển bởi Microsoft, là JavaScript với kiểu dáng tĩnh. Nó giúp phát hiện lỗi sớm hơn và viết code dễ bảo trì hơn.

## Lợi ích của TypeScript

- **Kiểu dáng tĩnh:** Phát hiện lỗi khi biên dịch, không phải lúc chạy.
- **Code completion:** IDE hỗ trợ gợi ý code tốt hơn.
- **Refactoring an toàn:** Thay đổi code dễ dàng hơn.
- **Documentation sống:** Kiểu dữ liệu là tài liệu tốt nhất.

## Cú pháp cơ bản

### Khai báo biến

```typescript
let name: string = "Góc Lập Trình";
let age: number = 25;
let isActive: boolean = true;
```

### Interface

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}
```

### Function

```typescript
function greet(user: User): string {
  return `Xin chào, ${user.name}!`;
}
```

## Kết luận

TypeScript giúp code của bạn an toàn và dễ bảo trì hơn. Hãy bắt đầu sử dụng TypeScript trong dự án tiếp theo của bạn!
