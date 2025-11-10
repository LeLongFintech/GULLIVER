# GULLIVER – Hệ thống phân tích báo cáo tài chính & cảnh báo rủi ro

> Full-stack project: Backend (Python/FastAPI) + Frontend (React/Vite/TypeScript) + Data pipeline cho cổ phiếu Việt Nam.

---

## 1. Giới thiệu / Overview

Dự án này xây dựng một hệ thống **phân tích báo cáo tài chính** và **giám sát rủi ro giao dịch** cho cổ phiếu trên thị trường chứng khoán Việt Nam (giai đoạn ~2020–2024).

Người dùng có thể:

- Chọn **mã cổ phiếu** và **năm** cần phân tích.
- Xem **bảng dữ liệu thô** (CĐKT, KQKD, LCTT).
- Xem **bảng chỉ số tài chính** đã tính sẵn (Indicators.csv).
- Xem **hệ thống biểu đồ** trực quan hóa cấu trúc tài sản, nguồn vốn, tăng trưởng, sinh lời, đòn bẩy & thanh khoản.
- Nhận **các cảnh báo rủi ro/giao dịch bất thường** từ mô hình risk engine ở backend.

Dự án được thiết kế như một mô hình mini cho:

- 🔍 Phân tích tài chính doanh nghiệp  
- 📈 Trực quan hóa dữ liệu tài chính  
- ⚠️ Phát hiện giao dịch bất thường / thao túng (risk & anomaly detection)  

---

## 2. Tính năng chính / Main Features

### 2.1. Tab **Dữ liệu** (Data Tab)

- Hiển thị dữ liệu đã được tiền xử lý từ các file:
  - `Balance_sheet` (Cân đối kế toán)
  - `Income_statement` (Kết quả kinh doanh)
  - `Cash_flow` (Lưu chuyển tiền tệ)
- Lọc theo:
  - Mã cổ phiếu (Ticker)
  - Năm
  - Loại báo cáo
- Bảng dữ liệu được format lại cho dễ đọc, phục vụ thao tác phân tích chi tiết.

### 2.2. Tab **Chỉ số** (Metrics / Indicators Tab)

- Đọc dữ liệu từ `Indicators.csv` và hiển thị:
  - Các chỉ số sinh lời (ROE, ROA, biên lợi nhuận, …)
  - Chỉ số cấu trúc vốn (D/E, nợ/tổng tài sản, …)
  - Chỉ số tăng trưởng, hiệu quả hoạt động, v.v.
- Chỉ hiển thị **theo mã được chọn** từ `Analysis.tsx` (đồng bộ với các tab khác).
- Dùng để xem nhanh “health check” tài chính của doanh nghiệp.

### 2.3. Tab **Biểu đồ** (Charts Tab)

Tập trung vào trực quan hóa insight theo từng trụ cột:

1. **Cấu trúc nguồn vốn**  
   - Biểu đồ cột chồng (Stacked Bar)  
   - Trục X: Năm  
   - Trục Y: Giá trị *NỢ PHẢI TRẢ* và *VỐN CHỦ SỞ HỮU*

2. **Cấu trúc tài sản**  
   - Biểu đồ miền xếp chồng (Stacked Area)  
   - Trục X: Năm  
   - Trục Y: *TÀI SẢN NGẮN HẠN* vs *TÀI SẢN DÀI HẠN*

3. **Tăng trưởng & sinh lời**  
   - Các biểu đồ thể hiện revenue, lợi nhuận, biên lợi nhuận qua năm  
   - Giúp nhìn được xu hướng doanh nghiệp đang mở rộng hay suy giảm

4. **Sức khỏe tài chính: “Đòn bẩy vs An toàn”**  
   - Biểu đồ Cột + Đường với 2 trục Y:
     - Y1 (Cột): Nợ / Vốn chủ sở hữu (DE) – **Rủi ro**  
     - Y2 (Đường): Thanh khoản hiện hành – **An toàn**
   - Mục tiêu: đặt **rủi ro** và **an toàn** đối nghịch trên cùng một biểu đồ để đánh giá sức khỏe tài chính.

### 2.4. Risk Engine & Cảnh báo giao dịch bất thường

- Backend có module `risk_engine.py`:
  - Đọc dữ liệu giao dịch (OHLCV, turnover, gap_open, vol_z, ret_1d, …).
  - Áp dụng mô hình học máy để chấm điểm **rủi ro thao túng / bất thường**.
  - Trả về:
    - Điểm rủi ro (risk score)
    - Flag cảnh báo cho từng observation.
- Có thể tích hợp output này lên frontend để:
  - Highlight các mã có hành vi giao dịch bất thường.
  - Hỗ trợ người dùng đánh giá cảnh báo nhanh.

---

## 3. Công nghệ sử dụng / Tech Stack

### Backend

- Python (3.x)
- FastAPI
- Uvicorn
- pandas, numpy
- scikit-learn (cho mô hình risk engine)
- joblib (nếu cần lưu model)
- Các thư viện xử lý CSV/Excel khác

### Frontend

- React
- Vite
- TypeScript
- pnpm (quản lý package)
- React Router
- @tanstack/react-query
- Recharts (vẽ biểu đồ)
- Tailwind CSS + shadcn/ui (UI components)

### Data

- Bộ dữ liệu báo cáo tài chính & giao dịch của cổ phiếu Việt Nam:
  - `Balance_sheet.xlsx`
  - `Income_statement.xlsx`
  - `Cash_flow.xlsx`
  - `Indicators.csv`
  - `OHLCV_Merge.csv`
  - `Stock_info.csv`
  - (và các file bổ trợ khác)

---

## 4. Cấu trúc thư mục / Project Structure

```bash
MID_TERM_PROJECT/
├─ backend/
│  ├─ app/
│  │  ├─ main.py          # Khởi tạo FastAPI app, định nghĩa API
│  │  ├─ analyzer.py      # Xử lý, load và merge dữ liệu tài chính
│  │  ├─ risk_engine.py   # Logic mô hình risk & cảnh báo
│  │  ├─ core/
│  │  │  └─ config.py     # Cấu hình (path data, ENV, v.v.)
│  │  └─ ...              # Các module hỗ trợ
│  ├─ data/
│  │  ├─ raw_data/        # File gốc: Excel/CSV
│  │  └─ preprocess_data/ # File đã xử lý, merge sẵn
│  └─ requirements.txt
│
├─ frontend/ hoặc front_end/
│  ├─ client/
│  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  │  ├─ Analysis.tsx   # Trang chính, chứa tabs
│  │  │  │  ├─ MetricsTab.tsx # Tab "Chỉ số"
│  │  │  │  └─ ChartsTab.tsx  # Tab "Biểu đồ"
│  │  │  └─ ui/               # Các component UI tái sử dụng
│  │  ├─ main.tsx
│  │  └─ ...
│  ├─ public/                 # Chứa các file CSV tĩnh (nếu FE đọc trực tiếp)
│  └─ vite.config.ts
│
└─ README.md
