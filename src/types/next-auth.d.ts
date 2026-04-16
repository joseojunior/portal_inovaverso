import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      accountType: string;
    };
  }

  interface User {
    role: string;
    accountType: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    accountType?: string;
  }
}
