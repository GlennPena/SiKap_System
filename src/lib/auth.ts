import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { checkLoginRateLimit, recordFailedLoginAttempt, clearFailedLoginAttempts } from "@/lib/login-rate-limiter";

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

        const email = credentials.email.trim().toLowerCase();

        // 1. Check if the account is currently in a 5-minute lockout cooldown
        const rateLimit = checkLoginRateLimit(email);
        if (rateLimit.isLocked) {
          throw new Error(rateLimit.message || "Account temporarily locked due to 5 failed attempts. Please wait 5 minutes.");
        }

        const user = await db.user.findUnique({
          where: { email },
          include: { barangay: true, councilor: true, officialAcc: true }
        });

        if (!user || user.status !== "Active") {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          // Record wrong password attempt and apply 5-minute cooldown if 5 attempts reached
          const failResult = recordFailedLoginAttempt(email);
          throw new Error(failResult.message || "Invalid password.");
        }

        // 2. Successful password match: immediately clear failed attempts counter
        clearFailedLoginAttempts(email);

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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.barangay = (user as any).barangay;
        token.barangayId = (user as any).barangayId;
        token.officialPosition = (user as any).officialPosition;
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.rememberMe = Boolean((user as any).rememberMe);
        token.authTime = Math.floor(Date.now() / 1000);
      }

      // Handle client session.update() calls
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }

      // Always synchronize latest user credentials from database on session refresh
      if (token.id) {
        try {
          const freshUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, email: true, status: true }
          });
          if (freshUser && freshUser.status === "Active") {
            token.name = freshUser.name;
            token.email = freshUser.email;
          }
        } catch {
          // fallback to existing token values
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).name = token.name;
        (session.user as any).email = token.email;
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
