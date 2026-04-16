import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentPublicUser() {
  const session = await auth();

  if (!session?.user?.id || session.user.accountType !== "user") {
    return null;
  }

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      slug: true,
      avatarUrl: true,
      isActive: true
    }
  });
}
