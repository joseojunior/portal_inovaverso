import type { NextAuthConfig } from "next-auth";

const adminRoles = new Set(["SUPER_ADMIN", "ADMIN", "EDITOR", "MODERATOR"]);

export const authConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 30
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accountType = user.accountType;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.role = typeof token.role === "string" ? token.role : "";
        session.user.accountType = typeof token.accountType === "string" ? token.accountType : "";
      }

      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      if (!nextUrl.pathname.startsWith("/admin")) {
        return true;
      }

      const role = typeof auth?.user?.role === "string" ? auth.user.role : "";

      return auth?.user?.accountType === "admin" && adminRoles.has(role);
    }
  }
} satisfies NextAuthConfig;
