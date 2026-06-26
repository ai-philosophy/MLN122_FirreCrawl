# 📈 MLN122_FirreCrawl — Smart Price Tracker

Hệ thống so sánh và theo dõi lịch sử biến động giá thiết bị điện tử (Điện thoại di động & Chuột gaming) tại các chuỗi cửa hàng bán lẻ hàng đầu Việt Nam. Dự án tích hợp công cụ cào dữ liệu thông minh **Firecrawl API** kết hợp cơ chế xử lý dự phòng (fallback) tự động.

---

## 🌟 Tính năng nổi bật

- 🔍 **So sánh giá thời gian thực**: Tổng hợp giá bán từ nhiều nguồn lớn: *CellphoneS, FPT Shop, ShopDunk, PhuCanh, GearVN, Tin Học Ngôi Sao*.
- 📊 **Biểu đồ lịch sử giá tối ưu**: Trực quan hóa biến động giá bằng Recharts. Tối ưu thuật toán vẽ nét đứt và chấm dữ liệu đồng tâm giúp hiển thị rõ ràng ngay cả khi giá các cửa hàng trùng khít nhau.
- 🕒 **Tự động hóa tác vụ (Scraper)**: Lập lịch cào dữ liệu định kỳ mỗi ngày lúc 2:00 AM sử dụng cron-job. Xử lý lưu trữ trực tiếp vào cơ sở dữ liệu PostgreSQL.
- 🤖 **Báo cáo thông minh**: Tự động đưa ra lời khuyên mua sắm (Nên mua ngay / Chờ đợi thêm) dựa trên phân tích giá trị rẻ nhất lịch sử.

---

## 📂 Cấu trúc dự án

Dự án dạng Monorepo gồm các phần chính:

```text
MLN122_FirreCrawl/
├── apps/                        # Core Firecrawl API & SDKs (Dùng cho self-hosted crawler)
├── price-tracker-app/           # Ứng dụng theo dõi giá (Thư mục chính)
│   ├── backend/                 # API Server (Java Spring Boot + PostgreSQL)
│   ├── frontend/                # Web UI (Next.js 16 + Tailwind CSS + Recharts)
│   └── scraper/                 # Worker Scraper (Node.js + Firecrawl SDK)
└── README.md
```

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu hệ thống
- **Docker & Docker Compose**
- **Java JDK 21**
- **Node.js (LTS)** & **Maven**

### Bước 1: Khởi động Cơ sở dữ liệu (PostgreSQL)
Di chuyển vào thư mục backend và chạy Docker Compose để khởi chạy PostgreSQL container:
```bash
cd price-tracker-app/backend
docker-compose up -d
```
*Database sẽ khởi chạy ở cổng `5432` với tên cơ sở dữ liệu `price_tracker`.*

### Bước 2: Chạy Backend (Spring Boot API)
Khởi chạy dịch vụ API ở cổng `8080`:
```bash
cd price-tracker-app/backend
mvn spring-boot:run
```
*(Nếu máy có nhiều phiên bản Java, hãy chỉ định đường dẫn Java 21 bằng biến môi trường `JAVA_HOME` trước khi chạy).*

### Bước 3: Chạy Frontend (Next.js UI)
Khởi chạy giao diện người dùng ở cổng `3000`:
```bash
cd price-tracker-app/frontend
npm install
npm run dev
```
Truy cập vào **[http://localhost:3000](http://localhost:3000)** để xem ứng dụng.

### Bước 4: Chạy Scraper (Thu thập dữ liệu)
Cào dữ liệu thủ công hoặc lập lịch chạy định kỳ:
```bash
cd price-tracker-app/scraper
npm install
npm run scrape            # Chạy cào dữ liệu ngay lập tức
npm run scrape:schedule   # Chạy scheduler tự động theo lịch (mỗi ngày lúc 2:00 AM)
```

---

## ⚙️ Cấu hình Biến môi trường (.env)

### 1. Dịch vụ Scraper (`price-tracker-app/scraper/.env`):
```env
FIRECRAWL_API_KEY=fc-your-key-here
FIRECRAWL_API_URL=https://api.firecrawl.dev
BACKEND_INGEST_URL=http://localhost:8080/api/tracker/offers/ingest
```

### 2. Dịch vụ Backend (`price-tracker-app/backend/src/main/resources/application.properties`):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/price_tracker
spring.datasource.username=postgres
spring.datasource.password=123456
github.models.token=your-token-here
```

---

## 👥 Nhóm phát triển
Dự án được xây dựng và tối ưu bởi **HaoHV2k5**.
