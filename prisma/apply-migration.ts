import "dotenv/config";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseStatements(sql: string) {
  return sql
    .replace(/^--.*$/gm, "")
    .split(/;\s*\r?\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const migrationName = process.argv[2] ?? "20260411_add_media_source_fields";
  const migrationPath = join(process.cwd(), "prisma", "migrations", migrationName, "migration.sql");

  const rawSql = readFileSync(migrationPath, "utf8");
  const statements = parseStatements(rawSql);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(`${statement};`);
  }

  console.log(`Migration aplicada com ${statements.length} statements.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
