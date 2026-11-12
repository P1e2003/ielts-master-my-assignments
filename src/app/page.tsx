"use client";

import { useCallback, useEffect, useState } from "react";
// Chỉ import kiểu (type-only import) để TypeScript xóa hoàn toàn khi build,
// đảm bảo mảng dữ liệu gốc MOCK_ASSIGNMENTS trên server không bị đóng gói vào JS phía trình duyệt.
import type {
  AssignmentBadge,
  AssignmentsApiResponse,
} from "@/lib/assignments";

// Bảng màu phân biệt rõ 4 loại nhãn trạng thái giúp học viên dễ quét bằng mắt.
const BADGE_STYLES: Record<AssignmentBadge, string> = {
  "Đã nộp": "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  "Nộp trễ": "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25",
  "Chưa nộp": "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
  "Quá hạn": "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
};

/** Hiển thị 1 hoặc nhiều nhãn trạng thái (ví dụ bài A04 hiển thị đồng thời "Đã nộp" + "Nộp trễ"). */
function StatusBadges({ badges }: { badges: AssignmentBadge[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[badge]}`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

export default function MyAssignmentsPage() {
  const [data, setData] = useState<AssignmentsApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Gọi API lấy bài tập của phiên hiện tại; không gửi studentId trên URL để tránh phụ thuộc dữ liệu từ client.
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/assignments", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Không thể tải danh sách bài tập (HTTP ${response.status}).`);
      }
      const payload = (await response.json()) as AssignmentsApiResponse;
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách bài tập.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  // Tính nhanh số lượng theo từng trạng thái chính để hiển thị trên thanh tổng quan.
  const items = data?.items ?? [];
  const submittedCount = items.filter((item) => item.status === "Đã nộp").length;
  const pendingCount = items.filter((item) => item.status === "Chưa nộp").length;
  const overdueCount = items.filter((item) => item.status === "Quá hạn").length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
            IELTS Master · E-Learning
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Bài tập của tôi
          </h1>
        </div>

        {data && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-md bg-white px-2.5 py-1.5 font-medium text-slate-700 shadow-xs ring-1 ring-slate-200">
              Học viên: <strong className="text-slate-900">{data.studentId}</strong>
            </span>
            <span className="rounded-md bg-white px-2.5 py-1.5 shadow-xs ring-1 ring-slate-200">
              Đối chiếu lúc:{" "}
              <strong className="font-medium text-slate-900">
                {data.referenceNowDisplay} (GMT+7)
              </strong>
            </span>
          </div>
        )}
      </header>

      {loading && (
        <section
          aria-live="polite"
          className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-xs ring-1 ring-slate-200"
        >
          Đang tải danh sách bài tập...
        </section>
      )}

      {!loading && error && (
        <section
          role="alert"
          className="rounded-xl bg-rose-50 p-6 text-sm text-rose-800 ring-1 ring-rose-200"
        >
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="mt-3 rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
          >
            Thử lại
          </button>
        </section>
      )}

      {!loading && !error && data && (
        <>
          <section
            aria-label="Tổng quan tiến độ"
            className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <div className="rounded-xl bg-white p-4 shadow-xs ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Tổng bài tập</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {items.length}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-xs ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Đã nộp</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {submittedCount}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-xs ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Chưa nộp</p>
              <p className="mt-1 text-2xl font-semibold text-sky-700">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-xs ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Quá hạn</p>
              <p className="mt-1 text-2xl font-semibold text-rose-700">
                {overdueCount}
              </p>
            </div>
          </section>

          {items.length === 0 ? (
            <section className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-xs ring-1 ring-slate-200">
              Hiện chưa có bài tập nào được giao.
            </section>
          ) : (
            <>
              {/* Giao diện bảng cho Desktop / Tablet ngang */}
              <div className="hidden overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-slate-200 md:block">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">
                        Mã
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Tên bài
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Hạn nộp (GMT+7)
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Thời điểm nộp
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4 font-mono text-xs font-medium text-slate-500">
                          {item.id}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {item.title}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {item.dueAtDisplay}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.submittedAtDisplay ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadges badges={item.badges} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Giao diện dạng thẻ cho Mobile */}
              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl bg-white p-4 shadow-xs ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-medium text-slate-500">
                          {item.id}
                        </span>
                        <h2 className="mt-0.5 text-base font-semibold text-slate-900">
                          {item.title}
                        </h2>
                      </div>
                      <StatusBadges badges={item.badges} />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <dt className="text-slate-500">Hạn nộp (GMT+7)</dt>
                        <dd className="mt-0.5 font-medium text-slate-800">
                          {item.dueAtDisplay}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Thời điểm nộp</dt>
                        <dd className="mt-0.5 font-medium text-slate-800">
                          {item.submittedAtDisplay ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

