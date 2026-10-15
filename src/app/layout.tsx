import type { Metadata } from "next";
import { getSiteBaseUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteBaseUrl() ?? undefined,
  title: {
    default: "Ramadù — Iniziativa studentesca | Polo Tecnico",
    template: "%s | Ramadù Polo Tecnico",
  },
  description:
    "Un progetto studentesco indipendente per il Polo Tecnico dell’IIS Massimiliano Ramadù. Scopri le idee e partecipa al sondaggio informale.",
  applicationName: "Ramadù — Polo Tecnico",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Ramadù — Polo Tecnico",
    title: "Ramadù — Iniziativa studentesca | Polo Tecnico",
    description: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
  },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  twitter: {
    card: "summary_large_image",
    title: "Ramadù — Polo Tecnico",
    description: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
