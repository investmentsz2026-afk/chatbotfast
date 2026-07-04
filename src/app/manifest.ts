import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ALERTA VIOLETA DEMO - Chatbot Inteligente',
    short_name: 'Alerta Violeta',
    description: 'Chatbot inteligente de asistencia y orientación contra la violencia de género. Encuentra comisarías y apoyo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#060613',
    theme_color: '#6366f1',
    orientation: 'portrait',
    categories: ['utilities', 'social'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
