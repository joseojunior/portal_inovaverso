import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function env(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const email = env("ADMIN_EMAIL").trim().toLowerCase();
  const password = env("ADMIN_PASSWORD");
  const name = (process.env.ADMIN_NAME || "Administrador Inovaverso").trim();

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must have at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "ADMIN",
      isActive: true
    },
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      isActive: true
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  console.log("[bootstrap-admin] Conta admin pronta:", admin);
}

main()
  .catch((error) => {
    console.error("[bootstrap-admin] Erro:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
