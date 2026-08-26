---
title: "Docker cho lập trình viên - Hướng dẫn cơ bản"
description: "Học cách sử dụng Docker để đóng gói và triển khai ứng dụng."
date: "2025-02-10"
category: "DevOps"
tags: ["Docker", "DevOps", "Container"]
author: "Góc Lập Trình"
image: "/images/docker-basics.jpg"
featured: false
---

# Docker cho lập trình viên

Docker giúp đóng gói ứng dụng cùng với tất cả các phụ thuộc vào một container, đảm bảo ứng dụng chạy giống nhau trên mọi môi trường.

## Tại sao cần Docker?

- **Khử môi trường:** "Works on my machine" sẽ không còn là vấn đề.
- **Tách biệt môi trường:** Mỗi dịch vụ chạy trong container riêng.
- **Triển khai nhanh chóng:** Khởi động và dừng container trong vài giây.
- **Mở rộng dễ dàng:** Thêm container mới khi cần xử lý tải cao.

## Các lệnh Docker cơ bản

```bash
# Tạo image từ Dockerfile
docker build -t my-app .

# Chạy container
docker run -p 3000:3000 my-app

# Liệt kê các container đang chạy
docker ps

# Dừng container
docker stop <container-id>
```

## Dockerfile cơ bản

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
```

## Kết luận

Docker là công cụ không thể thiếu cho lập trình viên hiện đại. Hãy bắt đầu sử dụng Docker ngay hôm nay!
