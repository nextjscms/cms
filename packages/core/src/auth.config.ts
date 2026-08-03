import { DefaultSession, NextAuthConfig } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [], // Configured in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      // Pass role from user object to JWT token during sign-in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass role from JWT to session so client/server can access it
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.AUTH_SECRET || "fallback_secret_for_nextjscms_to_be_securely_overwritten"
};
