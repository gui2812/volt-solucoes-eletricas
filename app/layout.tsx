import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volt Soluções Elétricas | Sistema Profissional",
  description: "Sistema profissional da Volt Soluções Elétricas com simulador QDC 3D, gestão de clientes, OS e financeiro."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
