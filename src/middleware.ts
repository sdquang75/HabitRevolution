import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth'; // Import auth helper

// 1. Tạo middleware cho i18n
const intlMiddleware = createMiddleware({
  locales: ['en', 'vi'],
  defaultLocale: 'en'
});

// 2. Middleware chính kết hợp cả hai
export default async function middleware(req: NextRequest) {
  // Kiểm tra session user
  const session = await auth();

  // Logic bảo vệ Route: Nếu chưa login mà cố vào dashboard -> đá về login
  const isDashboard = req.nextUrl.pathname.includes('/dashboard');
  const isAuthPage = req.nextUrl.pathname.includes('/login') || req.nextUrl.pathname.includes('/register');

  if (isDashboard && !session) {
    // Chưa login mà đòi vào dashboard -> Về trang login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthPage && session) {
    // Đã login rồi mà còn vào trang login -> Đá vào dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Cuối cùng chạy qua intl để xử lý ngôn ngữ
  return intlMiddleware(req);
}

export const config = {
  // Matcher bỏ qua các file api, _next, static
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};