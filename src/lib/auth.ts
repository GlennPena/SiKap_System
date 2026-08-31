import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { barangay: true }
        });

        if (!user || user.status !== "Active") return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) return null;

        const rememberMe = credentials?.rememberMe === "true" || credentials?.rememberMe === "1";

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          barangay: user.barangay?.name || undefined,
          barangayId: user.barangayId || undefined,
          rememberMe: rememberMe,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.barangay = (user as any).barangay;
        token.barangayId = (user as any).barangayId;
        token.id = user.id;
        token.rememberMe = Boolean((user as any).rememberMe);
        token.authTime = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).barangay = token.barangay;
        (session.user as any).barangayId = token.barangayId;
        (session.user as any).rememberMe = token.rememberMe;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days maximum session lifetime
  },
  secret: process.env.NEXTAUTH_SECRET || "sikap_super_secret_jwt_key_2026_san_luis_pampanga_secure"
};
