import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bài tập của tôi | IELTS Master E-Learning",
  description: "Danh sách bài tập và trạng thái nộp bài của học viên IELTS Master.",
};

/** Layout gốc của ứng dụng (thiết lập ngôn ngữ tiếng Việt và nền giao diện chung). */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

