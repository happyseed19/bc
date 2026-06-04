# Facebook Ads Performance Dashboard

Ứng dụng Dashboard Single-Page tĩnh (HTML/CSS/JS) hiện đại, trực quan hóa dữ liệu từ báo cáo quảng cáo Facebook Ads. Ứng dụng được thiết kế nhằm mang lại giao diện trực quan, trực tiếp hiển thị các chỉ số KPI, hiệu suất chiến dịch, Ad Set, xu hướng hàng ngày và hỗ trợ nhập trực tiếp dữ liệu mới từ file Excel (`.xlsx`).

---

## 🚀 Các Tính Năng Nổi Bật

1. **Tổng Quan KPI Động**:
   - Hiển thị các thẻ chỉ số cốt lõi: Chi Phí, Doanh Thu, ROAS, CPA, Chuyển Đổi, CTR, CPC, Hiển Thị.
   - Đi kèm sparkline (biểu đồ mini) thể hiện xu hướng biến động và badge tỷ lệ phần trăm (tăng/giảm) có màu sắc trực quan (Xanh lá: tích cực, Đỏ: tiêu cực).
   - Bảng so sánh chi tiết so với kỳ trước kèm theo phần tự động đánh giá tự động dựa trên file báo cáo gốc.
2. **Quản Lý Chiến Dịch & Ad Set Tiện Lợi**:
   - Bảng danh sách hiển thị đầy đủ thông số hoạt động của từng Chiến dịch và Ad Set.
   - Hỗ trợ **tìm kiếm thời gian thực (Real-time Search)**, **lọc trạng thái** và **lọc theo nhóm chiến dịch**.
   - Hỗ trợ **sắp xếp (Sorting)** tăng/giảm dần theo các cột số liệu (Chi phí, Doanh thu, ROAS, CPA, v.v.).
3. **Biểu Đồ Xu Hướng Đa Chiều (ApexCharts)**:
   - Biểu đồ tương tác so sánh Xu hướng Chi phí và Doanh thu hàng ngày (Trục tung kép - Dual Y-Axis).
   - Biểu đồ theo dõi biến động ROAS và CPA để đánh giá hiệu quả tối ưu theo thời gian.
4. **Hệ Thống Nhận Xét & Đề Xuất Trực Quan**:
   - Phân tích Điểm mạnh, Điểm yếu dưới dạng các thẻ đẹp mắt.
   - Khuyến nghị hành động dạng **Checklist tương tác** (người dùng có thể tích chọn để đánh dấu công việc đã hoàn thành).
   - Thiết kế sẵn phần chữ ký duyệt báo cáo chuyên nghiệp khi in ấn.
5. **Đọc File Excel Động (Client-Side Parser - SheetJS)**:
   - Cho phép người dùng **kéo & thả (Drag-and-drop)** hoặc chọn file Excel `.xlsx` báo cáo mẫu bất kỳ.
   - Hệ thống tự động đọc dữ liệu các sheet trực tiếp trên trình duyệt bằng thư viện SheetJS, xử lý chuyển đổi thành JSON và cập nhật giao diện Dashboard ngay lập tức mà không cần tải lại trang.
   - Dữ liệu mới được tự động lưu vào `LocalStorage` của trình duyệt để tiếp tục hiển thị khi F5.
6. **Chế Độ Giao Diện Sáng/Tối (Light/Dark Mode)**:
   - Nút chuyển đổi mượt mà ở Sidebar giúp chuyển đổi tông màu sắc HSL chuyên nghiệp, bảo vệ mắt và nâng cao trải nghiệm người dùng.
7. **Xuất Báo Cáo Linh Hoạt**:
   - Hỗ trợ **In / Xuất PDF** với bộ CSS In chuyên biệt, tự động ẩn Sidebar/nút bấm và tối ưu khổ giấy sạch sẽ để in hoặc gửi khách hàng.
   - Hỗ trợ **Xuất ngược dữ liệu ra file Excel** từ dữ liệu đang hiển thị hiện tại.

---

## 🛠️ Công Nghệ Sử Dụng

- **Core**: HTML5, Vanilla CSS3 (Custom Variables, CSS Grid, Flexbox, Transitions) & Vanilla JS (ES6+).
- **Vẽ biểu đồ**: [ApexCharts](https://apexcharts.com/) (thông qua CDN).
- **Đọc Excel**: [SheetJS (XLSX)](https://sheetjs.com/) (thông qua CDN).
- **Bộ Icon**: [Lucide Icons](https://lucide.dev/) (thông qua CDN).
- **Font chữ**: Google Fonts "Plus Jakarta Sans".

---

## 📦 Hướng Dẫn Deploy Lên GitHub Và Hostinger

Vì ứng dụng được xây dựng hoàn toàn bằng các file tĩnh (Static SPA), việc deploy cực kỳ đơn giản và không tốn phí tài nguyên server.

### Bước 1: Khởi tạo Git & Commit Code tại máy của bạn
Mở Terminal (hoặc PowerShell/Git Bash) tại thư mục `d:\Code\bc` và chạy các lệnh sau:

```bash
# Khởi tạo Git repository
git init

# Tạo file .gitignore để bỏ qua các file không cần thiết (như các file test tạm thời)
echo "node_modules/" > .gitignore
echo ".DS_Store" >> .gitignore

# Thêm tất cả các file vào Git
git add .

# Commit phiên bản đầu tiên
git commit -m "Initial commit: Facebook Ads Performance Dashboard SPA"
```

### Bước 2: Đẩy code lên GitHub
1. Truy cập [GitHub](https://github.com/) và đăng nhập tài khoản của bạn.
2. Tạo một Repository mới (ví dụ đặt tên là `fbads-dashboard`).
3. Copy URL của Repository đó (có dạng `https://github.com/username/fbads-dashboard.git`).
4. Chạy các lệnh sau trong Terminal để đẩy code lên:

```bash
# Đổi tên nhánh chính thành main
git branch -M main

# Liên kết Repository local với GitHub
git remote add origin URL_REPOSITORY_CỦA_BẠN

# Đẩy code lên GitHub
git push -u origin main
```

---

### Bước 3: Deploy lên Hostinger

Bạn có thể deploy lên Hostinger theo 2 cách đơn giản sau:

#### Cách 1: Sử dụng tính năng Tự động Đồng bộ Git của Hostinger (Khuyên dùng)
1. Đăng nhập vào **Hostinger hPanel**.
2. Di chuyển tới mục **Website** -> Chọn website bạn muốn triển khai -> Vào mục **Git** (nằm dưới phần Nâng cao hoặc Trình quản lý).
3. Tại phần **Repository Address**, dán link Git từ GitHub của bạn vào (Ví dụ: `https://github.com/username/fbads-dashboard.git`).
4. Nhập tên nhánh là `main`.
5. Trong ô **Install Directory**, để trống hoặc điền tên thư mục con nếu bạn muốn chạy ở đường dẫn phụ (ví dụ: `fbads` thì trang web sẽ có dạng `domain.com/fbads`). Để trống nếu muốn chạy ngay tại trang chủ `domain.com`.
6. Nhấp vào nút **Create**.
7. Bật tính năng **Auto Deployment (Webhooks)**: Hostinger sẽ cung cấp một URL Webhook. Bạn chỉ cần copy URL này, vào trang GitHub Repository của bạn -> **Settings** -> **Webhooks** -> **Add Webhook** -> Dán URL vào ô Payload URL -> Chọn content type là `application/json` -> Nhấn **Add Webhook**.
   - *Kết quả*: Từ bây giờ, mỗi khi bạn chạy lệnh `git push` lên GitHub, Hostinger sẽ tự động kéo code mới nhất về và cập nhật trang web của bạn trong vòng vài giây!

#### Cách 2: Tải lên thủ công qua File Manager (Trình Quản Lý File) hoặc FTP
1. Đăng nhập vào **Hostinger hPanel** -> Chọn website của bạn -> Vào **Trình quản lý tệp (File Manager)**.
2. Di chuyển vào thư mục `public_html`.
3. Nhấp vào biểu tượng **Upload** ở góc trên bên phải.
4. Chọn và tải lên 4 file chính:
   - `index.html`
   - `style.css`
   - `default_data.js`
   - `app.js`
5. Truy cập tên miền của bạn để kiểm tra kết quả!

---

## 📝 Hướng Dẫn Sử Dụng
- **Mặc định**: Ứng dụng tự động tải dữ liệu từ file `default_data.js` (dữ liệu Tháng 5/2026 lấy từ file mẫu `fbads.xlsx` của bạn).
- **Đổi giao diện**: Bấm vào nút **Giao diện Sáng / Tối** ở góc dưới Sidebar.
- **Xem xu hướng**: Vào tab **Xu hướng theo Ngày** để tương tác với biểu đồ thu phóng và rê chuột để xem số liệu chi tiết.
- **In báo cáo**: Bấm nút **Xuất PDF / In** để mở giao diện in của hệ điều hành. Giao diện in đã được thiết kế sẵn để ẩn các thanh menu và định dạng trang in cực đẹp.
- **Cập nhật dữ liệu mới**: 
  - Vào tab **Nhập Báo Cáo Excel**.
  - Kéo thả file Excel báo cáo mới (có cấu trúc sheet tương tự file mẫu) vào vùng kéo thả.
  - Hệ thống sẽ tự động cập nhật số liệu mới trên tất cả các tab Dashboard.
