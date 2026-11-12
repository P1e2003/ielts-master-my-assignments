// Ba trạng thái chính của bài tập; nhãn "Nộp trễ" đi kèm khi nộp sau hạn.
export type PrimaryStatus = "Chưa nộp" | "Quá hạn" | "Đã nộp";
export type AssignmentBadge = PrimaryStatus | "Nộp trễ";

/** Bản ghi gốc lưu ở tầng server (có chứa studentId của từng học viên). */
export interface AssignmentRecord {
  id: string;
  studentId: string;
  title: string;
  dueAt: string;
  submittedAt: string | null;
}

export interface AssignmentStatusEvaluation {
  status: PrimaryStatus;
  isLate: boolean;
  badges: AssignmentBadge[];
}

/**
 * DTO trả về cho client sau khi đã lọc theo học viên đăng nhập.
 * Không đính kèm studentId từng dòng và không bao giờ chứa dữ liệu của học viên khác.
 */
export interface StudentAssignmentItem {
  id: string;
  title: string;
  dueAt: string;
  dueAtDisplay: string;
  submittedAt: string | null;
  submittedAtDisplay: string | null;
  status: PrimaryStatus;
  isLate: boolean;
  badges: AssignmentBadge[];
}

export interface AssignmentsApiResponse {
  studentId: string;
  referenceNow: string;
  referenceNowDisplay: string;
  items: StudentAssignmentItem[];
}

/**
 * Mốc thời gian cố định theo yêu cầu đề bài: 11/11/2026, 09:00 (GMT+7).
 * Không dùng new Date() thời gian thực để kết quả luôn nhất quán khi chấm bài.
 */
export const REFERENCE_NOW_ISO = "2026-11-11T09:00:00+07:00";

const SIMULATED_SERVER_STUDENT_ID = "S01";

/**
 * Dữ liệu mẫu của đề bài (tất cả mốc giờ theo GMT+7).
 * Chỉ sử dụng ở phía server, tuyệt đối không import runtime vào Client Component.
 */
export const MOCK_ASSIGNMENTS: readonly AssignmentRecord[] = [
  {
    id: "A01",
    studentId: "S01",
    title: "Foundation U1 – Reading",
    dueAt: "2026-11-13T23:59:00+07:00",
    submittedAt: null,
  },
  {
    id: "A02",
    studentId: "S01",
    title: "Foundation U2 – Listening",
    dueAt: "2026-11-09T23:59:00+07:00",
    submittedAt: null,
  },
  {
    id: "A03",
    studentId: "S01",
    title: "Foundation U3 – Writing",
    dueAt: "2026-11-10T23:59:00+07:00",
    submittedAt: "2026-11-10T20:00:00+07:00",
  },
  {
    id: "A04",
    studentId: "S01",
    title: "Foundation U4 – Speaking",
    dueAt: "2026-11-08T23:59:00+07:00",
    submittedAt: "2026-11-10T12:00:00+07:00",
  },
  {
    id: "B01",
    studentId: "S02",
    title: "Foundation U1 – Reading",
    dueAt: "2026-11-13T23:59:00+07:00",
    submittedAt: null,
  },
];

// Cố định múi giờ Asia/Ho_Chi_Minh (GMT+7) và định dạng 24h (h23: 00-23)
// để kết quả hiển thị giống hệt nhau dù chạy trên Windows giờ VN hay container Docker giờ UTC.
const vnDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Chuyển chuỗi ISO-8601 sang epoch milliseconds để so sánh chính xác tuyệt đối.
function parseIsoMs(iso: string, label: string): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid timestamp for ${label}: ${iso}`);
  }
  return ms;
}

/**
 * Định dạng mốc thời gian sang chuẩn dd/MM/yyyy HH:mm cố định theo múi giờ GMT+7,
 * không phụ thuộc múi giờ hệ điều hành của máy chạy code.
 */
export function formatVietnamDateTime(iso: string): string {
  const ms = parseIsoMs(iso, "iso");
  const parts = vnDateTimeFormatter.formatToParts(new Date(ms));
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.day}/${lookup.month}/${lookup.year} ${lookup.hour}:${lookup.minute}`;
}

/**
 * Tính trạng thái bài tập theo 4 quy tắc của đề bài:
 * - Nộp trước hoặc đúng hạn -> "Đã nộp"
 * - Nộp sau hạn -> "Đã nộp" + "Nộp trễ"
 * - Chưa nộp và quá hạn -> "Quá hạn"
 * - Chưa nộp và còn hạn -> "Chưa nộp"
 */
export function evaluateAssignmentStatus(
  assignment: Pick<AssignmentRecord, "dueAt" | "submittedAt">,
  nowIso: string = REFERENCE_NOW_ISO,
): AssignmentStatusEvaluation {
  const dueMs = parseIsoMs(assignment.dueAt, "dueAt");

  // Nhánh 1: Học viên đã nộp bài -> so sánh thời điểm nộp với hạn nộp.
  if (assignment.submittedAt !== null) {
    const submittedMs = parseIsoMs(assignment.submittedAt, "submittedAt");
    const isLate = submittedMs > dueMs;
    return {
      status: "Đã nộp",
      isLate,
      badges: isLate ? ["Đã nộp", "Nộp trễ"] : ["Đã nộp"],
    };
  }

  // Nhánh 2: Học viên chưa nộp bài -> đối chiếu mốc thời gian giả lập (11/11/2026 09:00 GMT+7) với hạn nộp.
  const nowMs = parseIsoMs(nowIso, "nowIso");
  const status: PrimaryStatus = nowMs > dueMs ? "Quá hạn" : "Chưa nộp";
  return {
    status,
    isLate: false,
    badges: [status],
  };
}

/**
 * Giả lập xác thực phiên đăng nhập ở phía server (luôn là S01).
 * Không nhận studentId từ URL hay query string của client.
 */
export function getAuthenticatedStudentId(): string {
  return SIMULATED_SERVER_STUDENT_ID;
}

/**
 * Lọc danh sách bài tập của đúng học viên và ánh xạ sang DTO công khai
 * (loại bỏ dữ liệu học viên khác như B01 của S02 ngay tại tầng server).
 */
export function getAssignmentsForStudent(
  studentId: string,
  records: readonly AssignmentRecord[] = MOCK_ASSIGNMENTS,
  nowIso: string = REFERENCE_NOW_ISO,
): AssignmentsApiResponse {
  // Lọc đúng bài tập của học viên hiện tại trước khi biến đổi sang DTO công khai
  // nhằm chặn triệt để việc rò rỉ bản ghi B01 của học viên S02.
  const items: StudentAssignmentItem[] = records
    .filter((record) => record.studentId === studentId)
    .map((record) => {
      const evaluation = evaluateAssignmentStatus(record, nowIso);
      return {
        id: record.id,
        title: record.title,
        dueAt: record.dueAt,
        dueAtDisplay: formatVietnamDateTime(record.dueAt),
        submittedAt: record.submittedAt,
        submittedAtDisplay: record.submittedAt ? formatVietnamDateTime(record.submittedAt) : null,
        status: evaluation.status,
        isLate: evaluation.isLate,
        badges: evaluation.badges,
      };
    });

  return {
    studentId,
    referenceNow: nowIso,
    referenceNowDisplay: formatVietnamDateTime(nowIso),
    items,
  };
}

export function getCurrentStudentAssignments(
  nowIso: string = REFERENCE_NOW_ISO,
): AssignmentsApiResponse {
  return getAssignmentsForStudent(getAuthenticatedStudentId(), MOCK_ASSIGNMENTS, nowIso);
}

