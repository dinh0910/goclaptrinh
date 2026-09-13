import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { loginLimiter } from "./rate-limit";

const DUMMY_BCRYPT_HASH =
  "$2b$12$.Vgu.OYIYkb9cWX9.K5A9.oPNTJji8OagOlqWVLox07Wij0cj5YT.";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          // Constant-time: always run bcrypt comparison on rejection so
          // response times are uniform regardless of whether the email exists.
          await bcrypt.compare("x", DUMMY_BCRYPT_HASH);
          return null;
        }

        const ip =
          req?.headers
            ?.get("x-forwarded-for")
            ?.split(",")[0]
            ?.trim() || "";
        if (!loginLimiter.allow(`${email}|${ip}`)) {
          await bcrypt.compare("x", DUMMY_BCRYPT_HASH);
          return null;
        }

        const user = db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .get();

        if (!user) {
          await bcrypt.compare("x", DUMMY_BCRYPT_HASH);
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub;
        token.role = (user as { role?: string }).role;
      } else {
        token.id = token.id ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
});
