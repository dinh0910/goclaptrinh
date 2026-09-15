import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "./credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Mã xác thực (TOTP)", type: "text" },
      },
      async authorize(credentials, req) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        const totp = typeof credentials?.totp === "string" ? credentials.totp : "";

        const result = await verifyCredentials(
          email,
          password,
          req?.headers ? (req.headers as Headers) : undefined,
          totp
        );

        if (!result.ok) return null;

        return {
          id: String(result.user.id),
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
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