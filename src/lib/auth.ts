import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { ngo: true },
        });

        if (!user || !user.isActive) return null;

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          ngoId: user.ngoId,
          ngoName: user.ngo?.name,
          ngoSlug: user.ngo?.slug,
          plan: user.ngo?.subscriptionPlan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.ngoId = (user as any).ngoId;
        token.ngoName = (user as any).ngoName;
        token.ngoSlug = (user as any).ngoSlug;
        token.plan = (user as any).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).ngoId = token.ngoId;
        (session.user as any).ngoName = token.ngoName;
        (session.user as any).ngoSlug = token.ngoSlug;
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
};

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  ngoId: string | null;
  ngoName?: string;
  ngoSlug?: string;
  plan?: string;
};
