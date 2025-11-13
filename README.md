# 📊 GULLIVER – Hệ thống phân tích dữ liệu tài chính & cảnh báo rủi ro cổ phiếu tại thị trường Việt Nam

> Full-stack project: Backend (Python/FastAPI) + Frontend (React/Vite/TypeScript) + Data pipeline cho cổ phiếu Việt Nam.

---

## 1. Giới thiệu / Overview

Dự án này xây dựng một hệ thống **phân tích báo cáo tài chính** và **giám sát rủi ro giao dịch** cho cổ phiếu trên thị trường chứng khoán Việt Nam (giai đoạn ~2020–2024).

Người dùng có thể:

- Chọn **mã cổ phiếu** và **năm** cần phân tích.
- Xem **bảng dữ liệu thô** (CĐKT, KQKD, LCTT).
- Xem **bảng chỉ số tài chính**.
- Xem **hệ thống biểu đồ** trực quan hóa cấu trúc tài sản, nguồn vốn, tăng trưởng, sinh lời, đòn bẩy & thanh khoản.
- Nhận **các cảnh báo rủi ro/giao dịch bất thường** từ mô hình Randome Forest.

Dự án được thiết kế như một mô hình mini cho:

- 🔍 Phân tích tài chính doanh nghiệp  
- 📈 Trực quan hóa dữ liệu tài chính  
- ⚠️ Phát hiện giao dịch bất thường / thao túng (risk & anomaly detection)
  
---

## 2. Tính năng chính / Main Features

### 2.1. Tab **Dữ liệu** (Data Tab)

- Hiển thị dữ liệu đã được tiền xử lý từ các file:
  - Balance_sheet (Cân đối kế toán)
  - Income_statement (Kết quả kinh doanh)
  - Cash_flow (Lưu chuyển tiền tệ)
- Lọc theo:
  - Mã cổ phiếu (Ticker)
  - Năm
  - Loại báo cáo
- Bảng dữ liệu được format lại cho dễ đọc, phục vụ thao tác phân tích chi tiết.

### 2.2. Tab **Chỉ số** (Metrics / Indicators Tab)

- Đọc dữ liệu từ Indicators.csv và hiển thị:
  - Các chỉ số sinh lời (ROE, ROA, biên lợi nhuận, …)
  - Chỉ số cấu trúc vốn (D/E, nợ/tổng tài sản, …)
  - Chỉ số tăng trưởng, hiệu quả hoạt động, v.v.
- Chỉ hiển thị **theo mã được chọn** từ Analysis.tsx (đồng bộ với các tab khác).
- Dùng để xem nhanh “health check” tài chính của doanh nghiệp.

### 2.3. Tab **Biểu đồ** (Charts Tab)

Tập trung vào trực quan hóa insight theo từng trụ cột:

1. **Cấu trúc nguồn vốn**  
2. **Cấu trúc tài sản**  
3. **Tăng trưởng & sinh lời**  
4. **Sức khỏe tài chính: “Đòn bẩy vs An toàn”**  

### 2.4. Risk Engine & Cảnh báo giao dịch bất thường

- Backend có module risk_engine.py:
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
  - Balance_sheet.xlsx
  - Income_statement.xlsx
  - Cash_flow.xlsx
  - Indicators.csv
  - OHLCV_Merge.csv
  - Stock_info.csv
  - (và các file bổ trợ khác)

---

## 4. Cấu trúc thư mục / Project Structure

```
├── 📁 backend
│   ├── 📁 app
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 analyzer.py
│   │   ├── 🐍 main.py
│   │   └── 🐍 risk_engine.py
│   ├── 📁 src
│   └── 📄 requirements.txt
├── 📁 data
│   ├── 📁 code
│   │   ├── 📄 average_indicators.ipynb
│   │   ├── 📄 data_preprocess.ipynb
│   │   └── 📄 indicators.ipynb
│   ├── 📁 data_cleaned
│   │   ├── 📄 Average_indicators.csv
│   │   ├── 📄 Balance_sheet.csv
│   │   ├── 📄 Cash_flow.csv
│   │   ├── 📄 Income_statement.csv
│   │   ├── 📄 Indicators.csv
│   │   ├── 📄 OHLCV_Merge.csv
│   │   ├── 📄 Share_outstanding.csv
│   │   └── 📄 Stock_info.csv
│   └── 📁 raw_data
│       ├── 📄 05-11-2025.xlsx
│       ├── 📄 Balance_sheet.xlsx
│       ├── 📄 CafeF.HNX.Upto02.11.2025.csv
│       ├── 📄 CafeF.HSX.Upto02.11.2025.csv
│       ├── 📄 Cash_flow.xlsx
│       ├── 📄 Data_Info_Vietnam (active).xlsx
│       ├── 📄 Income_statement.xlsx
│       ├── 📄 Monetary.xlsx
│       └── 📄 info.xlsx
├── 📁 frontend
│   ├── 📁 .builder
│   │   └── 📁 rules
│   │       ├── 📄 deploy-app.mdc
│   │       └── 📄 organize-ui.mdc
│   ├── 📁 client
│   │   ├── 📁 components
│   │   │   ├── 📁 common
│   │   │   │   ├── 📄 ThemeToggle.tsx
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 layout
│   │   │   │   ├── 📄 AppShell.tsx
│   │   │   │   └── 📄 TopBar.tsx
│   │   │   ├── 📁 pages
│   │   │   │   ├── 📁 analysis
│   │   │   │   │   ├── 📄 AiTab.tsx
│   │   │   │   │   ├── 📄 AlertsTab.tsx
│   │   │   │   │   ├── 📄 ChartsTab.tsx
│   │   │   │   │   └── 📄 MetricsTab.tsx
│   │   │   │   ├── 📄 Analysis.tsx
│   │   │   │   └── 📄 Home.tsx
│   │   │   └── 📁 ui
│   │   │       ├── 📄 accordion.tsx
│   │   │       ├── 📄 alert-dialog.tsx
│   │   │       ├── 📄 alert.tsx
│   │   │       ├── 📄 aspect-ratio.tsx
│   │   │       ├── 📄 avatar.tsx
│   │   │       ├── 📄 badge.tsx
│   │   │       ├── 📄 breadcrumb.tsx
│   │   │       ├── 📄 button.tsx
│   │   │       ├── 📄 calendar.tsx
│   │   │       ├── 📄 card.tsx
│   │   │       ├── 📄 carousel.tsx
│   │   │       ├── 📄 chart.tsx
│   │   │       ├── 📄 checkbox.tsx
│   │   │       ├── 📄 collapsible.tsx
│   │   │       ├── 📄 command.tsx
│   │   │       ├── 📄 context-menu.tsx
│   │   │       ├── 📄 dialog.tsx
│   │   │       ├── 📄 drawer.tsx
│   │   │       ├── 📄 dropdown-menu.tsx
│   │   │       ├── 📄 form.tsx
│   │   │       ├── 📄 hover-card.tsx
│   │   │       ├── 📄 input-otp.tsx
│   │   │       ├── 📄 input.tsx
│   │   │       ├── 📄 label.tsx
│   │   │       ├── 📄 menubar.tsx
│   │   │       ├── 📄 navigation-menu.tsx
│   │   │       ├── 📄 pagination.tsx
│   │   │       ├── 📄 popover.tsx
│   │   │       ├── 📄 progress.tsx
│   │   │       ├── 📄 radio-group.tsx
│   │   │       ├── 📄 resizable.tsx
│   │   │       ├── 📄 scroll-area.tsx
│   │   │       ├── 📄 select.tsx
│   │   │       ├── 📄 separator.tsx
│   │   │       ├── 📄 sheet.tsx
│   │   │       ├── 📄 sidebar.tsx
│   │   │       ├── 📄 skeleton.tsx
│   │   │       ├── 📄 slider.tsx
│   │   │       ├── 📄 sonner.tsx
│   │   │       ├── 📄 switch.tsx
│   │   │       ├── 📄 table.tsx
│   │   │       ├── 📄 tabs.tsx
│   │   │       ├── 📄 textarea.tsx
│   │   │       ├── 📄 toast.tsx
│   │   │       ├── 📄 toaster.tsx
│   │   │       ├── 📄 toggle-group.tsx
│   │   │       ├── 📄 toggle.tsx
│   │   │       ├── 📄 tooltip.tsx
│   │   │       └── 📄 use-toast.ts
│   │   ├── 📁 contexts
│   │   │   ├── 📄 ThemeContext.tsx
│   │   │   └── 📄 index.ts
│   │   ├── 📁 hooks
│   │   │   ├── 📄 use-mobile.tsx
│   │   │   └── 📄 use-toast.ts
│   │   ├── 📁 lib
│   │   │   ├── 📄 ratios.ts
│   │   │   ├── 📄 utils.spec.ts
│   │   │   └── 📄 utils.ts
│   │   ├── 📁 pages
│   │   │   ├── 📄 Index.tsx
│   │   │   └── 📄 NotFound.tsx
│   │   ├── 📄 App.tsx
│   │   ├── 📄 App.tsx.new
│   │   ├── 🎨 global.css
│   │   └── 📄 vite-env.d.ts
│   ├── 📁 netlify
│   │   └── 📁 functions
│   │       └── 📄 api.ts
│   ├── 📁 public
│   │   ├── 📄 Average_indicators.csv
│   │   ├── 📄 Balance_sheet.csv
│   │   ├── 📄 Cash_flow.csv
│   │   ├── 📄 Income_statement.csv
│   │   ├── 📄 Indicators.csv
│   │   ├── 📄 OHLCV_Merge.csv
│   │   ├── 📄 Share_outstanding.csv
│   │   ├── 📄 Stock_info.csv
│   │   ├── 📄 favicon.ico
│   │   ├── 🖼️ placeholder.svg
│   │   └── 📄 robots.txt
│   ├── 📁 server
│   │   ├── 📁 routes
│   │   │   └── 📄 demo.ts
│   │   ├── 📄 index.ts
│   │   └── 📄 node-build.ts
│   ├── 📁 shared
│   │   └── 📄 api.ts
│   ├── ⚙️ .dockerignore
│   ├── ⚙️ .gitignore
│   ├── ⚙️ .npmrc
│   ├── ⚙️ .prettierrc
│   ├── 📝 AGENTS.md
│   ├── ⚙️ components.json
│   ├── 🌐 index.html
│   ├── ⚙️ netlify.toml
│   ├── ⚙️ package.json
│   ├── ⚙️ pnpm-lock.yaml
│   ├── 📄 postcss.config.js
│   ├── 📄 tailwind.config.ts
│   ├── ⚙️ tsconfig.json
│   ├── 📄 vite.config.server.ts
│   └── 📄 vite.config.ts
├── 📁 training_model
│   └── 📄 machine_learning_model.ipynb
└── 📝 README.md
```

## 5. Cài đặt & chạy dự án / Getting Started

### 5.1. Yêu cầu hệ thống / Prerequisites

Trước khi bắt đầu, hãy đảm bảo bạn đã cài:

- Git  
  Dùng để clone project & quản lý version.  

- Python 3.10+ (khuyến nghị 3.10–3.12)  
  Dùng cho backend (FastAPI, xử lý dữ liệu).  
  Khi cài trên Windows nhớ tick “Add Python to PATH”.

- Node.js 18+  
  Dùng để chạy frontend (Vite + React + TypeScript).  

- pnpm (package manager cho frontend)  
  Sau khi cài Node.js xong, chạy:
```
npm install -g pnpm
```
- (Tuỳ chọn) Visual Studio Code  
  Editor để mở & chỉnh sửa code.
---

### 5.2. Clone project từ GitHub

    git clone https://github.com/LeLongFintech/GULLIVER.git
    cd MID_TERM_PROJECT

---

### 5.3. Cài đặt & chạy Backend (FastAPI)

#### 5.3.1. Tạo virtual environment

**Windows (PowerShell / CMD):**

    cd backend
    python -m venv .venv
    .venv\Scripts\activate

**macOS / Linux (bash / zsh):**

    cd backend
    python3 -m venv .venv
    source .venv/bin/activate

> 💡 Virtual env giúp cô lập thư viện của dự án, tránh xung đột với các project khác.

---

#### 5.3.2. Cài dependencies backend

    pip install -r requirements.txt

(sau khi bạn đã cài đủ các lib cần như fastapi, uvicorn, pandas, numpy, scikit-learn, ...)

---

#### 5.3.3. Chạy server FastAPI

    uvicorn app.main:app --reload --port 8000

Mặc định, server chạy tại:

- http://127.0.0.1:8000  
- hoặc http://localhost:8000

---

### 5.4. Cài đặt & chạy Frontend (React + Vite + TypeScript)

    cd MID_TERM_PROJECT/frontend

> 💡 Backend và frontend sẽ chạy **song song** ở 2 terminal khác nhau:
> - Terminal 1: chạy FastAPI (backend).
> - Terminal 2: chạy Vite (frontend).

---

#### 5.4.1. Cài dependencies frontend

    pnpm install

---

#### 5.4.2. Cấu hình biến môi trường frontend (kết nối tới backend)

Trong thư mục frontend (hoặc front_end), tạo file `.env` hoặc `.env.local`:

    VITE_PUBLIC_BUILDER_KEY=http://localhost:8000/api

---

#### 5.4.3. Chạy dev server frontend

    pnpm dev

Thông thường Vite sẽ chạy ở:

- http://localhost:5173

Mở trình duyệt và truy cập:  
http://localhost:5173

Nếu bạn thay port trong config (hoặc Vite báo đang dùng port khác), trên terminal sẽ hiển thị đường dẫn chính xác – hãy dùng URL đó.

---

**Interaction FE–BE**

   - Khi bạn chọn Mã / Năm trên frontend:
     - FE gọi API sang backend (qua URL base `VITE_PUBLIC_BUILDER_KEY`).
     - Backend đọc dữ liệu từ CSV/Excel (balance sheet, indicators, ohlcv, ...) → xử lý → trả JSON.
     - FE render bảng dữ liệu, biểu đồ, chỉ số, cảnh báo rủi ro (nếu có).
---

## 6. Dữ liệu đầu vào / Data Description

Tùy cấu trúc cụ thể, nhưng các file chính bao gồm:

- **Balance_sheet.*:**  
  Cân đối kế toán nhiều năm (2020–2024)  
  Các nhóm chính: Tài sản, Nợ phải trả, Vốn chủ sở hữu, ...

- **Income_statement.*:**  
  Kết quả kinh doanh  
  Doanh thu, Lợi nhuận gộp, Lợi nhuận sau thuế, EPS, ...

- **Cash_flow.*:**  
  Lưu chuyển tiền tệ  
  Dòng tiền hoạt động, đầu tư, tài chính, ...

- **Indicators.csv:**  
  Tổng hợp các chỉ số tài chính tính sẵn theo: Mã – Năm

- **OHLCV_Merge.csv:**  
  Dữ liệu giá: open, high, low, close, volume, turnover, ...  
  Là input cho risk engine & phân tích giao dịch

- **Stock_info.csv:**  
  Thông tin mã: Symbol, Sector, Exchange, ...
---

## 7. Cách đóng góp / Contributing

1. Fork repo  
2. Tạo branch mới: `feature/my-feature`  
3. Commit thay đổi: `git commit -m "Add my feature"`  
4. Push branch: `git push origin feature/my-feature`  
5. Tạo Pull Request

---

## 8. License

Dự án hiện được sử dụng chủ yếu cho **mục đích học tập & nghiên cứu**.  
Nếu bạn muốn sử dụng lại mã nguồn cho mục đích khác, vui lòng liên hệ tác giả.

---

## 9. Tác giả / Author

- **Lê Hoàng Long**  
  - Linkedin: https://www.linkedin.com/in/long-le-hoang-92b446319/.
  - Email: hoanglongstudy210505@gmail.om
---
