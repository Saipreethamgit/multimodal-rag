import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocMind — Chat with your documents",
  description: "Upload PDFs and images. Ask anything. Powered by pgvector + GPT-4o.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
