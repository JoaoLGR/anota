import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ANOTA", description: "Suas anotações, simples e organizadas.", manifest: "/manifest.webmanifest", icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" }, appleWebApp: { capable: true, title: "ANOTA", statusBarStyle: "default" }, other: { "mobile-web-app-capable": "yes" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
