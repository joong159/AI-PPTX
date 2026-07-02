import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideAI — AI 프레젠테이션 생성기",
  description: "AI로 5초 만에 멋진 프레젠테이션을 만드세요. 편집, 저장, PPTX 내보내기까지.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
