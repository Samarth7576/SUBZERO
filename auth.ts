import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import NodemailerProvider from "next-auth/providers/nodemailer";
import { prisma } from "./lib/db";

const isDevelopment = process.env.NODE_ENV !== "production";

const providers: Provider[] = [
  GoogleProvider({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
      },
    },
    checks: ["state"],
  }),
];

if (process.env.AUTH_EMAIL_SERVER && process.env.AUTH_EMAIL_FROM) {
  providers.push(
    NodemailerProvider({
      server: process.env.AUTH_EMAIL_SERVER,
      from: process.env.AUTH_EMAIL_FROM,
    }),
  );
}

if (isDevelopment) {
  providers.push(
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (
          credentials?.email === "test@ledger.local" &&
          credentials.password === "ledger-dev"
        ) {
          return {
            id: "00000000-0000-4000-8000-000000000001",
            email: "test@ledger.local",
            name: "Ledger Test User",
          };
        }

        return null;
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
});
