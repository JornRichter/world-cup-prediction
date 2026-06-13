import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Cup Prediction Challenge",
  description: "Predict matches and compete with friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}