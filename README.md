# SafeMove HaNoi

SafeMove HaNoi là dự án công nghệ môi trường, tập trung vào việc giúp người dùng di chuyển thông minh hơn trong đô thị thông qua dữ liệu chất lượng không khí theo thời gian thực.

Mục tiêu chính:
- Đề xuất lộ trình ít ô nhiễm nhưng vẫn hợp lý về quãng đường.
- Cá nhân hóa gợi ý sức khỏe theo tình trạng hô hấp và thói quen vận động.
- Cung cấp cảnh báo AQI để hỗ trợ ra quyết định an toàn khi di chuyển và hoạt động ngoài trời.

## Team (5 thành viên)
- Đỗ Hà Lan (Teamlead) - HUS
- Nguyễn Hồng Khánh Vân - HUST
- Hoàng Quỳnh Chi - HUS
- Đỗ Thị Quỳnh Hương - TMU
- Đào Thái Hoàng - HUST

## Kiến trúc dự án
- FE: React + Vite + Tailwind (thư mục FE)
- BE: Node.js (ESM) + API thuần HTTP (thư mục BE)
- Database: Neon PostgreSQL
- Dịch vụ ngoài: IQAir (AQI theo GPS), Nominatim/OSRM (search địa điểm và route)

## Cấu trúc thư mục chính
- FE: giao diện web
- BE: backend API
- db: script SQL khởi tạo schema
- .env: biến môi trường dùng chung

## Yêu cầu môi trường
- Node.js 20+ (khuyến nghị)
- npm 10+
- Có tài khoản và key cho Neon, IQAir

## Cài đặt nhanh
Mở terminal tại thư mục gốc dự án và chạy:

### 1. Cài dependencies
- FE:
  - cd FE
  - npm install
- BE:
  - cd ../BE
  - npm install

### 2. Cấu hình biến môi trường
Tạo hoặc cập nhật file .env ở root dự án với format:

- DATABASE_URL=<neon_postgres_connection_string>
- PORT=5001
- IQAIR_API_KEY=<your_iqair_api_key>
- LLM_PROVIDER=ollama
- LLM_BASE_URL=http://127.0.0.1:11434/v1
- LLM_API_KEY=ollama
- LLM_MODEL=qwen2.5:7b

Tạo hoặc cập nhật FE/.env.local:
- VITE_API_BASE_URL=http://localhost:5001

Lưu ý:
- PORT bên BE và VITE_API_BASE_URL bên FE phải đồng bộ cùng cổng.
- Không commit key thật lên public repository.

## Chạy dự án
Dùng 2 terminal riêng:

### Terminal 1: chạy Backend
- cd BE
- npm run dev

Kỳ vọng log:
- SafeMove HaNoi BE listening on http://localhost:5001

### Terminal 2: chạy Frontend
- cd FE
- npm run dev

Kỳ vọng log:
- VITE ready
- Local: http://localhost:5173 (hoặc cổng khác nếu 5173 bận)

## Kiểm tra nhanh hệ thống
- Health API:
  - GET http://localhost:5001/api/health
- AQI theo GPS test nhanh:
  - GET http://localhost:5001/api/aqi/iqair?lat=21.0285&lng=105.8542

Nếu endpoint IQAir báo thiếu key:
- Missing IQAIR_API_KEY on server
=> kiểm tra lại file .env và restart BE.

## Scripts thường dùng
### FE
- npm run dev: chạy local
- npm run build: build production
- npm run preview: preview build

### BE
- npm run dev: chạy backend với .env ở root
- npm run check: kiểm tra kết nối DB

## Chức năng hiện có
- Đăng nhập/đăng ký cơ bản
- Dashboard AQI và gợi ý cá nhân hóa
- Lấy GPS người dùng và truy vấn AQI qua IQAir
- Tab lộ trình với 3 lựa chọn:
  - Lộ trình xanh
  - Lộ trình ngắn nhất
  - Lộ trình cân bằng
- Màn chỉ đường theo tuyến đã chọn

## Roadmap gợi ý
- Tối ưu thuật toán scoring cho route xanh theo nhiều đoạn đường và dữ liệu AQI lịch sử
- Thêm cache cho map search/routing để giảm độ trễ
- Hoàn thiện auth + phân quyền + logging production
- Thiết lập CI/CD và test tự động cho FE/BE

## Ghi chú bảo mật
- Không đưa key thật vào tài liệu công khai.
- Nên rotate DATABASE_URL/IQAIR_API_KEY nếu lộ thông tin.
