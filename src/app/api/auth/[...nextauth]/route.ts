import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        barangay: { label: "Barangay", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // In full DB mode, query db.user.findUnique. For flexible demo login:
        return {
          id: credentials.email.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name: credentials.email.split("@")[0],
          email: credentials.email,
          role: credentials.role || "SK Official",
          barangay: credentials.barangay || "San Sebastian"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.barangay = (user as any).barangay;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).barangay = token.barangay;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "sikap_super_secret_jwt_key_2026_san_luis_pampanga_secure"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
