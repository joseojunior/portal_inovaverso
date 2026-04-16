import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentAdminUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return db.adminUser.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true
    }
  });
}

export async function requireAdminUser() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser?.isActive) {
    redirect("/login");
  }

  return adminUser;
}
