import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      ngoId: string | null;
      ngoName?: string;
      ngoSlug?: string;
      plan?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    ngoId: string | null;
    ngoName?: string;
    ngoSlug?: string;
    plan?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    ngoId: string | null;
    ngoName?: string;
    ngoSlug?: string;
    plan?: string;
  }
}
