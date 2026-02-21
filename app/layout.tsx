import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumio",
  description:
    "A safe, AI-powered storybook companion for children — with parent insights and safety controls.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='32' font-size='32'>🌟</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
