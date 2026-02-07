import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Super Admin panel requires SUPER_ADMIN role
      if (path.startsWith("/admin")) {
        return token?.role === "SUPER_ADMIN";
      }

      // Dashboard requires auth
      if (path.startsWith("/dashboard")) {
        return !!token;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
