import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { dbAdapter } from "@/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const loginId = credentials.email as string;
        
        // Try getting user by email first
        let user = await dbAdapter.getUserByEmail(loginId);
        
        // If not found by email, try querying by name
        if (!user) {
          const { getDb } = await import('@/db');
          const { users } = await import('@/db/schema');
          const { eq } = await import('drizzle-orm');
          const db = getDb();
          const nameMatches = await db.select().from(users).where(eq(users.name, loginId)).limit(1);
          if (nameMatches.length > 0) {
            user = nameMatches[0] as any;
          }
        }
        
        if (!user) return null;
        
        // Hash the provided password using the same Web Crypto API as the setup script
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(credentials.password as string));
        const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (passwordHash === user.password) {
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        
        return null;
      }
    })
  ],
});
