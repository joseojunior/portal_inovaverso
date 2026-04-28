import { AdminRole } from "@prisma/client";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const email = getRequiredEnv("ADMIN_EMAIL").trim().toLowerCase();
  const password = getRequiredEnv("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Administrador Inovaverso";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);

  const admin = await db.adminUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true
    },
    create: {
      email,
      name,
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  console.log("Admin account ready:", admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
