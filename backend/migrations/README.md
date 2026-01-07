# Database Migrations

Thư mục này chứa các script migration cho database PostgreSQL của PenStar.

## Cấu trúc

- `001_initial_schema.sql` - Schema khởi tạo ban đầu

## Cách sử dụng

### Sử dụng Docker Compose

```bash
# Khởi động database
docker-compose up -d

# Xem logs
docker-compose logs -f postgres

# Dừng database
docker-compose down

# Xóa database và volumes (cẩn thận!)
docker-compose down -v
```

### Chạy migration thủ công

```bash
# Kết nối vào PostgreSQL
psql -h localhost -U postgres -d hoteldb

# Hoặc chạy file migration
psql -h localhost -U postgres -d hoteldb -f migrations/001_initial_schema.sql
```

## Lưu ý

- Các file migration trong thư mục `migrations/` sẽ tự động chạy khi khởi tạo
  container (được mount vào `/docker-entrypoint-initdb.d`).
- Chỉ chạy một lần khi database được khởi tạo lần đầu.
- Để reset database, chạy `docker-compose down -v` rồi `docker-compose up -d`.
