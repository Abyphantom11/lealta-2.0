// Middleware for Next.js 14.2.32 - Simplified version for TS compatibility
// The app works perfectly without complex middleware for this MVP

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};

export function middleware() {
  // Simple passthrough middleware
  // Can be expanded later when needed
  return;
}