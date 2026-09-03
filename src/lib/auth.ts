import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

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
          include: { barangay: true, councilor: true, officialAcc: true }
        });

        if (!user || user.status !== "Active") return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) return null;

        const rememberMe = credentials?.rememberMe === "true" || credentials?.rememberMe === "1";

        let officialPosition: string | undefined = undefined;
        if (user.councilor?.role) {
          const r = user.councilor.role.trim();
          officialPosition = r.toLowerCase().includes("secretary") ? "SK Secretary" : r.toLowerCase().includes("treasurer") ? "SK Treasurer" : "SK Councilor";
        } else if (user.officialAcc?.role) {
          officialPosition = user.officialAcc.role;
        } else if (user.role === Role.SK_OFFICIAL) {
          const c = await db.councilor.findFirst({ where: { email: user.email } });
          if (c) {
            const r = c.role.trim();
            officialPosition = r.toLowerCase().includes("secretary") ? "SK Secretary" : r.toLowerCase().includes("treasurer") ? "SK Treasurer" : "SK Councilor";
          } else {
            officialPosition = "SK Chairperson";
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          barangay: user.barangay?.name || undefined,
          barangayId: user.barangayId || undefined,
          officialPosition,
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
        token.officialPosition = (user as any).officialPosition;
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
        (session.user as any).officialPosition = token.officialPosition;
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
