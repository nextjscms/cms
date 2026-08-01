import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

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
        
        // Hide the import from Turbopack static analysis by using a dynamic path or eval
        // This avoids the 'expected chunkable module for async reference' compiler panic in Next 16.
        const dbPath = '@/db';
        const { dbAdapter } = await import(/* webpackIgnore: true */ dbPath);
        const user = await dbAdapter.getUserByEmail(credentials.email as string);
        
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
