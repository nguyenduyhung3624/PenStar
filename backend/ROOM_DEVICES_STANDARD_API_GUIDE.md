# Hướng dẫn sử dụng API kiểm tra tiêu chuẩn thiết bị phòng

## 1. API kiểm tra tiêu chuẩn cho tất cả phòng theo loại phòng

- **Endpoint:** `GET /roomdevices/check-standard-by-type/:roomTypeId`
- **Tham số:**
  - `roomTypeId`: ID loại phòng cần kiểm tra
- **Kết quả trả về:**
  - Danh sách các phòng thuộc loại này và trạng thái thiết bị từng phòng (thiếu/thừa thiết bị nào, số lượng thực tế/tiêu chuẩn)
  - Ví dụ:
    ```json
    [
      {
        "roomId": 101,
        "roomName": "101",
        "ok": false,
        "errors": [
          "Thiết bị Điều hòa Daikin 1HP thiếu (1/2)",
          "Thiết bị Máy sấy tóc thiếu (0/1)"
        ]
      },
      {
        "roomId": 102,
        "roomName": "102",
        "ok": true,
        "errors": []
      }
    ]
    ```

## 2. Quy trình sử dụng (dành cho frontend hoặc admin)

1. Chọn loại phòng cần kiểm tra.
2. Gọi API trên với roomTypeId tương ứng.
3. Hiển thị kết quả cho từng phòng:
   - Nếu `ok: true` → Phòng đủ thiết bị theo tiêu chuẩn.
   - Nếu `ok: false` → Hiển thị danh sách thiết bị thiếu/thừa để nhân viên kiểm tra, bổ sung hoặc xử lý.
4. Có thể xuất báo cáo hoặc in danh sách phòng chưa đạt chuẩn để phục vụ công tác kiểm tra thực tế.

## 3. Lưu ý quan trọng

- Chức năng kiểm tra tiêu chuẩn thiết bị chỉ để cảnh báo số lượng thiết bị so với tiêu chuẩn loại phòng, phục vụ kiểm tra định kỳ hoặc chuẩn bị phòng.
- Việc ghi nhận thiết bị hỏng/mất trong quá trình khách ở phải thực hiện tại màn booking detail (admin), gắn với từng booking cụ thể. Chức năng này phục vụ xử lý bồi thường, sửa chữa và cập nhật thiết bị thực tế.
- Không sử dụng kết quả kiểm tra tiêu chuẩn để thay thế cho nghiệp vụ ghi nhận sự cố thiết bị.

---

Nếu cần bổ sung hướng dẫn cho API khác hoặc quy trình nghiệp vụ, vui lòng liên hệ bộ phận phát triển.
