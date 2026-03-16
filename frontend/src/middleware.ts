import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  userId: string;
  email:  string;
  role:   'user' | 'admin';
  exp:    number;
}

const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const tokenCookie  = req.cookies.get('token')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // ── No token: block protected routes ─────────────────────
  if (!tokenCookie) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  // ── Decode token (don't trust without server verify, but
  //    good enough for redirect decisions at the edge) ───────
  let payload: JwtPayload | null = null;
  try {
    payload = jwtDecode<JwtPayload>(tokenCookie);
    // Check expiry
    if (Date.now() >= payload.exp * 1000) {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('token');
      return res;
    }
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('token');
    return res;
  }

  // ── Token valid + trying to visit public route → redirect ─
  if (isPublicRoute) {
    const dest = payload.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── Admin route guard ─────────────────────────────────────
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};