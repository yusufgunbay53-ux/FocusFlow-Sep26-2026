import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusFlow — AI Görev & Odak Asistanı",
  description: "Kanban, Pomodoro, ambient ses ve AI performans koçu.",
  manifest: "/manifest.json",
  applicationName: "FocusFlow",
};

export const viewport: Viewport = {
  themeColor: "#0b111e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
