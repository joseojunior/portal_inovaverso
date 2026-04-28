import { z } from "zod";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const email = getRequiredEnv("ADMIN_EMAIL");
  const password = getRequiredEnv("ADMIN_PASSWORD");

  const parsed = credentialsSchema.safeParse({ email, password });

  if (!parsed.success) {
    throw new Error("Credentials did not pass schema validation.");
  }

  const adminUser = await db.adminUser.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      isActive: true
    }
  });

  if (!adminUser || !adminUser.isActive) {
    throw new Error("Admin user not found or inactive.");
  }

  const isValid = await verifyPassword(parsed.data.password, adminUser.passwordHash);

  if (!isValid) {
    throw new Error("Password verification failed.");
  }

  console.log("Admin login check successful:", {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    isActive: adminUser.isActive
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
