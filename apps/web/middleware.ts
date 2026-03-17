import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não exigem autenticação
const publicRoutes = ['/login', '/register', '/pricing', '/area-restrita'];

// Rotas que exigem autenticação de admin
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Obter tokens dos cookies com validação básica (tamanho mínimo)
    const token = request.cookies.get('access_token')?.value;
    const adminToken = request.cookies.get('admin_access_token')?.value;

    const isAuthenticated = Boolean(token && token.length > 20);
    const isAdminAuthenticated = Boolean(adminToken && adminToken.length > 20);

    console.log(`[Middleware] Path: ${pathname} - Auth: ${isAuthenticated} - Admin: ${isAdminAuthenticated}`);

    // Helper para clonar URL e alterar pathname de forma eficiente
    const redirect = (path: string) => {
        console.log(`[Middleware] Redirecting to: ${path}`);
        const url = request.nextUrl.clone();
        url.pathname = path;
        return NextResponse.redirect(url);
    };

    // 2. Lógica para a raiz (/)
    if (pathname === '/') {
        if (isAuthenticated && !isAdminAuthenticated) return redirect('/dashboard');
        return NextResponse.next();
    }

    // 3. Checar tipos de rota usando startsWith para suportar sub-rotas
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    // 4. Bloquear rotas públicas (login/register) se já estiver logado
    // BUG FIX: Permitir que o admin acesse rotas públicas livremente para logout ou troca de conta
    if (isPublicRoute && isAuthenticated && !isAdminAuthenticated) {
        return redirect('/dashboard');
    }

    // 5. Proteger rotas de Admin
    if (isAdminRoute && !isAdminAuthenticated) {
        return redirect('/login');
    }

    // 6. Proteger rota de Dashboard
    if (pathname.startsWith('/dashboard') && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Configuração do matcher otimizada para performance
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next (Next.js internal files)
         * - favicon.ico (favicon file)
         * - assets, images, fonts (static assets)
         * - common file extensions (.png, .jpg, .svg, .webp, .woff, .css, .js, etc)
         */
        '/((?!api|_next|favicon.ico|assets|images|fonts|.*\\..*).*)',
    ],
};
