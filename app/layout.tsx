import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "YerAuksion — Yer auksioni hisoblash tizimi",
  description:
    "Yer uchastkasi ijara huquqi boshlang'ich narxini hisoblash va rasmiy hujjat generatsiya qilish tizimi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
