import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Rotta Delivery Control',
        short_name: 'RDC',
        description: 'Sistema de controle de corridas para entregadores',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
            {
                src: '/icon-dark-32x32.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
            {
                src: '/icon-dark-32x32.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-dark-32x32.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
