import { getServerSession } from "next-auth";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (session) {
    return res.status(400).json({ message: "Already logged in" });
  }


  const testUser = {
    user: {
      name: "Test Admin",
      email: "testadmin@example.com",
    },
  };

  return res.status(200).json(testUser);
}
