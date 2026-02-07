import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Dashboard requires auth
      if (path.startsWith("/dashboard")) {
        return !!token;
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
