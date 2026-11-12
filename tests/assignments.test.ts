import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../src/app/api/assignments/route";
import {
  type AssignmentsApiResponse,
  evaluateAssignmentStatus,
  formatVietnamDateTime,
  getAssignmentsForStudent,
  getCurrentStudentAssignments,
  MOCK_ASSIGNMENTS,
  REFERENCE_NOW_ISO,
} from "../src/lib/assignments";

test("Test 1: Logic trạng thái bài tập chính xác cho đủ 4 trường hợp mẫu và mốc biên đúng hạn", () => {
  const byId = Object.fromEntries(MOCK_ASSIGNMENTS.map((row) => [row.id, row]));

  // A01: Chưa nộp và còn hạn (13/11/2026 23:59 > 11/11/2026 09:00) -> Chưa nộp
  assert.deepEqual(evaluateAssignmentStatus(byId.A01, REFERENCE_NOW_ISO), {
    status: "Chưa nộp",
    isLate: false,
    badges: ["Chưa nộp"],
  });

  // A02: Chưa nộp và đã quá hạn (09/11/2026 23:59 < 11/11/2026 09:00) -> Quá hạn
  assert.deepEqual(evaluateAssignmentStatus(byId.A02, REFERENCE_NOW_ISO), {
    status: "Quá hạn",
    isLate: false,
    badges: ["Quá hạn"],
  });

  // A03: Nộp trước hạn (10/11 20:00 <= 10/11 23:59) -> Đã nộp
  assert.deepEqual(evaluateAssignmentStatus(byId.A03, REFERENCE_NOW_ISO), {
    status: "Đã nộp",
    isLate: false,
    badges: ["Đã nộp"],
  });

  // A04: Nộp sau hạn (10/11 12:00 > 08/11 23:59) -> Đã nộp + Nộp trễ
  assert.deepEqual(evaluateAssignmentStatus(byId.A04, REFERENCE_NOW_ISO), {
    status: "Đã nộp",
    isLate: true,
    badges: ["Đã nộp", "Nộp trễ"],
  });

  // Biên 1: Nộp đúng phút hết hạn (submittedAt === dueAt) vẫn là Đã nộp đúng hạn
  assert.deepEqual(
    evaluateAssignmentStatus(
      {
        dueAt: "2026-11-10T23:59:00+07:00",
        submittedAt: "2026-11-10T23:59:00+07:00",
      },
      REFERENCE_NOW_ISO,
    ),
    {
      status: "Đã nộp",
      isLate: false,
      badges: ["Đã nộp"],
    },
  );

  // Biên 2: Chưa nộp đúng vào phút hết hạn (now === dueAt) vẫn còn hạn -> Chưa nộp
  assert.deepEqual(
    evaluateAssignmentStatus(
      {
        dueAt: "2026-11-11T09:00:00+07:00",
        submittedAt: null,
      },
      REFERENCE_NOW_ISO,
    ),
    {
      status: "Chưa nộp",
      isLate: false,
      badges: ["Chưa nộp"],
    },
  );
});

test("Test 2: Service chỉ lọc đúng dữ liệu của S01 và loại bỏ hoàn toàn B01 của S02", () => {
  const result = getCurrentStudentAssignments();

  assert.equal(result.studentId, "S01");
  assert.equal(result.referenceNowDisplay, "11/11/2026 09:00");
  assert.deepEqual(
    result.items.map((item) => item.id),
    ["A01", "A02", "A03", "A04"],
  );
  assert.equal(
    result.items.some((item) => item.id === "B01"),
    false,
    "Không được phép xuất hiện bài tập B01 của học viên S02",
  );

  // Kiểm tra hàm lọc tổng quát với S02 chỉ trả về B01
  const s02Result = getAssignmentsForStudent("S02");
  assert.deepEqual(
    s02Result.items.map((item) => item.id),
    ["B01"],
  );
});

test("Test 3: API Route GET /api/assignments bỏ qua ?studentId=S02 trên URL và không lộ dữ liệu S02", async () => {
  const spoofedRequest = new Request(
    "http://localhost:3000/api/assignments?studentId=S02",
  );
  const response = await GET(spoofedRequest);

  assert.equal(response.status, 200);
  const body = (await response.json()) as AssignmentsApiResponse;

  assert.equal(body.studentId, "S01");
  assert.deepEqual(
    body.items.map((item) => ({ id: item.id, badges: item.badges })),
    [
      { id: "A01", badges: ["Chưa nộp"] },
      { id: "A02", badges: ["Quá hạn"] },
      { id: "A03", badges: ["Đã nộp"] },
      { id: "A04", badges: ["Đã nộp", "Nộp trễ"] },
    ],
  );
  assert.equal(JSON.stringify(body).includes("B01"), false);
  assert.equal(JSON.stringify(body).includes("S02"), false);
});

test("Test 4: Định dạng thời gian luôn cố định theo GMT+7 dù truyền chuỗi giờ UTC tương đương", () => {
  // 2026-11-13T16:59:00Z tương đương 2026-11-13T23:59:00+07:00
  assert.equal(
    formatVietnamDateTime("2026-11-13T16:59:00Z"),
    "13/11/2026 23:59",
  );
});

