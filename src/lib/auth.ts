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

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { ngo: true },
          });

          if (!user) {
            console.error(`[AUTH] User not found: ${credentials.email}`);
            // Check if ANY users exist
            const count = await prisma.user.count();
            console.error(`[AUTH] Total users in database: ${count}`);
            return null;
          }

          if (!user.isActive) {
            console.error(`[AUTH] User inactive: ${credentials.email}`);
            return null;
          }

          const isValid = await compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.error(`[AUTH] Invalid password for: ${credentials.email}`);
            return null;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          console.log(`[AUTH] Login success: ${user.email} (${user.role})`);

          // For SUPER_ADMIN without an NGO, auto-assign the first available NGO
          let ngoId = user.ngoId;
          let ngoName = user.ngo?.name;
          let ngoSlug = user.ngo?.slug;
          let ngoLogoUrl = user.ngo?.logoUrl;
          let plan = user.ngo?.subscriptionPlan;

          if (user.role === "SUPER_ADMIN") {
            plan = "ELITE" as any; // Super Admin always gets full access
            if (!ngoId) {
              const firstNgo = await prisma.ngo.findFirst({
                orderBy: { createdAt: "asc" },
              });
              if (firstNgo) {
                ngoId = firstNgo.id;
                ngoName = firstNgo.name;
                ngoSlug = firstNgo.slug;
                ngoLogoUrl = firstNgo.logoUrl;
              }
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            ngoId,
            ngoName,
            ngoSlug,
            ngoLogoUrl,
            plan,
          };
        } catch (error: any) {
          console.error(`[AUTH] Database error:`, error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.ngoId = (user as any).ngoId;
        token.ngoName = (user as any).ngoName;
        token.ngoSlug = (user as any).ngoSlug;
        token.ngoLogoUrl = (user as any).ngoLogoUrl;
        token.plan = (user as any).plan;
      }

      // Handle session.update() calls (used for impersonation)
      if (trigger === "update" && updateData) {
        // START impersonation
        if (updateData.impersonateNgoId && token.role === "SUPER_ADMIN") {
          if (!token.isImpersonating) {
            token.originalNgoId = token.ngoId;
            token.originalNgoName = token.ngoName;
            token.originalNgoSlug = token.ngoSlug;
            token.originalNgoLogoUrl = token.ngoLogoUrl;
          }
          token.ngoId = updateData.impersonateNgoId;
          token.ngoName = updateData.impersonateNgoName;
          token.ngoSlug = updateData.impersonateNgoSlug;
          token.ngoLogoUrl = updateData.impersonateNgoLogoUrl;
          token.isImpersonating = true;
        }

        // STOP impersonation
        if (updateData.stopImpersonation && token.isImpersonating) {
          token.ngoId = token.originalNgoId ?? null;
          token.ngoName = token.originalNgoName;
          token.ngoSlug = token.originalNgoSlug;
          token.ngoLogoUrl = token.originalNgoLogoUrl;
          token.isImpersonating = false;
          token.originalNgoId = undefined;
          token.originalNgoName = undefined;
          token.originalNgoSlug = undefined;
          token.originalNgoLogoUrl = undefined;
        }
      }

      // Ensure SUPER_ADMIN always has ELITE plan and an ngoId
      if (token.role === "SUPER_ADMIN") {
        token.plan = "ELITE";
        if (!token.ngoId) {
          try {
            const firstNgo = await prisma.ngo.findFirst({
              orderBy: { createdAt: "asc" },
            });
            if (firstNgo) {
              token.ngoId = firstNgo.id;
              token.ngoName = firstNgo.name;
              token.ngoSlug = firstNgo.slug;
              token.ngoLogoUrl = firstNgo.logoUrl;
            }
          } catch {
            // Ignore DB errors in jwt callback
          }
        }
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
        (session.user as any).ngoLogoUrl = token.ngoLogoUrl;
        (session.user as any).plan = token.plan;
        (session.user as any).isImpersonating = token.isImpersonating || false;
        (session.user as any).originalNgoId = token.originalNgoId;
        (session.user as any).originalNgoName = token.originalNgoName;
        (session.user as any).originalNgoSlug = token.originalNgoSlug;
        (session.user as any).originalNgoLogoUrl = token.originalNgoLogoUrl;
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
  ngoLogoUrl?: string | null;
  plan?: string;
  isImpersonating?: boolean;
  originalNgoId?: string | null;
  originalNgoName?: string;
  originalNgoSlug?: string;
  originalNgoLogoUrl?: string | null;
};
