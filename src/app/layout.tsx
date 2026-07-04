import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ALERTA VIOLETA DEMO | Chatbot de Ayuda e Inteligencia",
  description:
    "Chatbot inteligente de asistencia y orientación ALERTA VIOLETA. Encuentra información, comisarías cercanas y recursos de apoyo.",
  keywords: ["alerta violeta", "chatbot", "ayuda", "comisaría", "violencia de género", "Perú"],
  authors: [{ name: "ChatbotFast" }],
  openGraph: {
    title: "ALERTA VIOLETA DEMO | Chatbot de Ayuda",
    description: "Chatbot inteligente de asistencia y orientación contra la agresión.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

function ServiceWorkerRegistrar() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (let registration of registrations) {
                registration.unregister();
                console.log('Service worker desregistrado para actualizar cache.');
              }
            }).catch(function() {});
          }
        `,
      }}
    />
  );
}
