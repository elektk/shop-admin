import NextAuth, { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const adminEmails = ["suportenik@gmail.com", "igorsuportstan@gmail.com"];
const testAdminEmails = ["testadmin@example.com"];

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: "Test Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("Authorize function called with:", credentials);
        const user = {
          id: "test-user",
          name: "Test Admin",
          email: "testadmin@example.com",
          role: "test_admin",
        };
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.email) {
        session.user.email = token.email;
        session.user.role = testAdminEmails.includes(token.email) ? "test_admin" : "admin";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = user.role || (testAdminEmails.includes(user.email) ? "test_admin" : "admin");
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);

export async function isAdminRequest(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!adminEmails.includes(session?.user?.email) && !testAdminEmails.includes(session?.user?.email)) {
    res.status(401).json({ error: "Not an admin" });
    throw new Error("Not an admin");
  }
}