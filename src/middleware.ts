import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard and form creation routes
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/forms/create') ||
            req.nextUrl.pathname.includes('/edit') ||
            req.nextUrl.pathname.includes('/responses')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/forms/create/:path*',
    '/forms/:path*/edit',
    '/forms/:path*/responses'
  ]
}