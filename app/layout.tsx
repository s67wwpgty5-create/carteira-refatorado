import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallApp from "./install-app";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Controle de Carteira",
  description: "Histórico de clientes, alertas e acompanhamento comercial.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true,title:"Carteira",statusBarStyle:"default"},
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#102944"};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}<InstallApp/></body>
    </html>
  );
}
