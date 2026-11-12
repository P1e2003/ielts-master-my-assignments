# Bài tập của tôi — IELTS Master E-Learning

Ứng dụng nhỏ xây dựng bằng **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS**, hiển thị danh sách bài tập và trạng thái nộp bài của học viên giả lập **`S01`** tại mốc thời gian cố định **`11/11/2026, 09:00 (GMT+7)`**.

---

## 1. Cấu trúc mã nguồn

```text
my-assignments/
├── src/
│   ├── app/
│   │   ├── api/assignments/route.ts  # GET /api/assignments (lọc dữ liệu S01 phía server)
│   │   ├── globals.css               # Cấu hình Tailwind CSS
│   │   ├── layout.tsx                # Layout gốc của ứng dụng
│   │   └── page.tsx                  # Màn hình "Bài tập của tôi" (responsive Desktop + Mobile)
│   └── lib/
│       └── assignments.ts            # Dữ liệu mẫu, mốc giờ GMT+7, logic 4 trạng thái & lọc S01
├── tests/
│   └── assignments.test.ts           # Bộ test tự động (node:test) cho trạng thái & phân tách S01/S02
└── README.md
```

---

## 2. Cách cài đặt và chạy dự án

**Yêu cầu môi trường:** Node.js `>= 20.9` (đã kiểm thử trên Node.js `v24.14.1`). Không cần tạo file `.env` hay cài đặt cơ sở dữ liệu.

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy môi trường phát triển
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`  
Endpoint API kiểm tra trực tiếp: `http://localhost:3000/api/assignments`

```bash
# Kiểm tra kiểu TypeScript và build production
npm run typecheck
npm run build
```

**Chạy nhanh bằng Docker Compose (tùy chọn):**

```bash
docker compose up -d --build
# Dừng container khi kiểm tra xong:
docker compose down
```

---

## 3. Cách chạy test và kết quả ghi nhận

Chạy bộ test tự động (sử dụng `node:test` tích hợp sẵn của Node.js thông qua `tsx`):

```bash
npm test
```

### Kết quả test ghi nhận

```text
✔ Test 1: Logic trạng thái bài tập chính xác cho đủ 4 trường hợp mẫu và mốc biên đúng hạn
✔ Test 2: Service chỉ lọc đúng dữ liệu của S01 và loại bỏ hoàn toàn B01 của S02
✔ Test 3: API Route GET /api/assignments bỏ qua ?studentId=S02 trên URL và không lộ dữ liệu S02
✔ Test 4: Định dạng thời gian luôn cố định theo GMT+7 dù truyền chuỗi giờ UTC tương đương
ℹ tests 4 | pass 4 | fail 0
```

1. **Test 1 — Logic 4 trạng thái & mốc biên đúng hạn** (`PASS`):
   - `A01` (`Foundation U1 – Reading`, hạn `13/11/2026 23:59`, chưa nộp) → **`Chưa nộp`**
   - `A02` (`Foundation U2 – Listening`, hạn `09/11/2026 23:59`, chưa nộp) → **`Quá hạn`**
   - `A03` (`Foundation U3 – Writing`, hạn `10/11/2026 23:59`, nộp `10/11/2026 20:00`) → **`Đã nộp`**
   - `A04` (`Foundation U4 – Speaking`, hạn `08/11/2026 23:59`, nộp `10/11/2026 12:00`) → **`Đã nộp` + `Nộp trễ`**
   - Kiểm tra thêm 2 mốc biên: nộp đúng phút hết hạn (`submittedAt === dueAt` → `Đã nộp` không trễ) và chưa nộp đúng phút hết hạn (`now === dueAt` → `Chưa nộp`).
2. **Test 2 — Service lọc đúng học viên `S01`** (`PASS`):
   - Chỉ trả về đúng 4 bản ghi `["A01", "A02", "A03", "A04"]`, loại bỏ hoàn toàn `B01` của `S02`.
3. **Test 3 — Chống giả mạo qua URL trên `GET /api/assignments?studentId=S02`** (`PASS`):
   - API vẫn trả về dữ liệu của `S01`, JSON phản hồi hoàn toàn không chứa `B01` hay `S02`.
4. **Test 4 — Định dạng thời gian cố định theo `GMT+7`** (`PASS`):
   - Dùng `Intl.DateTimeFormat` với `timeZone: "Asia/Ho_Chi_Minh"`, đảm bảo hiển thị đúng ngày giờ Việt Nam dù chạy trên máy đặt múi giờ khác (`UTC`, `US`, ...).

---

## 4. Cách tránh lộ dữ liệu của học viên `S02`

1. **Xác định danh tính hoàn toàn ở phía server (`getAuthenticatedStudentId()`):** Học viên hiện tại (`S01`) được đọc từ phiên giả lập phía server, **tuyệt đối không đọc `studentId` từ URL, query string (`?studentId=S02`) hay client header** để tránh lỗi IDOR (Insecure Direct Object Reference).
2. **Lọc dữ liệu trước khi trả về và dùng DTO công khai (`getAssignmentsForStudent()`):** Tập dữ liệu mẫu được lọc `record.studentId === studentId` ngay trên server trước khi ánh xạ sang `StudentAssignmentItem`, đảm bảo bản ghi `B01` của `S02` không bao giờ đi ra khỏi API response.
3. **Tách biệt hoàn toàn khỏi bundle phía trình duyệt:** `src/app/page.tsx` chỉ dùng `import type` (bị xóa hoàn toàn khi biên dịch TypeScript) và gọi `fetch("/api/assignments")`, do đó mảng `MOCK_ASSIGNMENTS` chứa `B01` của `S02` không bao giờ bị đóng gói vào JavaScript phía client.

---

## 5. Phần chưa làm (Ngoài phạm vi bài test 3 giờ)

- Hệ thống đăng nhập / xác thực thực tế (JWT, Session Cookie, OAuth) thay cho phiên `S01` giả lập trên server.
- Kết nối cơ sở dữ liệu thực tế (PostgreSQL/Prisma) và phân trang, tìm kiếm, lọc theo trạng thái trên giao diện.
- Trang chi tiết bài tập và chức năng học viên tải bài làm / nộp bài mới lên hệ thống.
- Kiểm thử giao diện tự động đầu-cuối (Playwright / Cypress).

