import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[AUTH] Authorize callback triggered for email:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing email or password");
          return null;
        }

        try {
          console.log("[AUTH] Fetching user from Prisma database...");
          const user = await prisma.user.findUnique({
            where: { email: (credentials.email as string).trim() }
          });

          if (!user) {
            console.log("[AUTH] User not found in database");
            return null;
          }

          if (!user.password) {
            console.log("[AUTH] User has no password set (OAuth only)");
            return null;
          }

          console.log("[AUTH] Comparing bcrypt passwords...");
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log("[AUTH] Invalid password entered");
            return null;
          }

          console.log("[AUTH] Authentication successful for user ID:", user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            subscriptionTier: user.subscriptionTier,
          };
        } catch (error) {
          console.error("[AUTH] Fatal database error during authorize:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore - custom property
        token.subscriptionTier = user.subscriptionTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-ignore - custom property
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-super-secret-key-123",
  debug: true,
});
