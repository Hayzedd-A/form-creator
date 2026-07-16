import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  providers: [], // add your providers here (e.g. Google, Credentials)
  callbacks: {
    // Optional: enrich session/token here
  },
};