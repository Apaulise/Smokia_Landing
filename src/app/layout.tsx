import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Las dos familias del sistema de diseño: Hanken Grotesk para interfaz,
// JetBrains Mono para datos. Pesos 400/500/600 — el sistema no usa 800.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmokIA — Tu negocio puede funcionar mejor",
  description:
    "Analizamos cómo funciona tu empresa, detectamos procesos que pueden mejorar y construimos soluciones con Inteligencia Artificial, automatización y software.",
  icons: { icon: "/smokia-mark.png" },
};

export const viewport: Viewport = {
  themeColor: "#131315",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${hanken.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
