import { NextResponse } from "next/server";
import { getCurrentStudentAssignments } from "@/lib/assignments";

// Bắt buộc xử lý động trên mỗi request, không cache tĩnh dữ liệu riêng của từng học viên.
export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  // Bảo mật chống IDOR: danh tính học viên được lấy từ phiên giả lập phía server (S01).
  // Cố tình không đọc query param từ _request (ví dụ ?studentId=S02) để client không thể mạo danh.
  const data = getCurrentStudentAssignments();
  return NextResponse.json(data, {
    headers: {
      // Ngăn trình duyệt hoặc proxy lưu cache dữ liệu phiên làm việc.
      "Cache-Control": "no-store",
    },
  });
}

