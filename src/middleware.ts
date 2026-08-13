import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      // Require the user to be logged in to access protected routes
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    // Add paths that require authentication here.
    // For now, only specific API routes are protected.
    // "/api/users/:path*"
    // The main app is a SPA and handles auth states client-side.
  ],
};
