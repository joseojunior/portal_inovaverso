import { z } from "zod";

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1).optional(),
  DIRECT_URL: z.string().trim().min(1).optional(),
  NEXTAUTH_URL: z.string().trim().url().optional(),
  NEXTAUTH_SECRET: z.string().trim().min(32).optional(),
  AI_INGESTION_TOKEN: z.string().trim().min(24).optional(),
  SUPABASE_URL: z.string().trim().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().trim().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional()
});

const authEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string().trim().min(1).optional(),
  NEXTAUTH_URL: z.string().trim().url().optional()
});

const aiEnvSchema = z.object({
  AI_INGESTION_TOKEN: z.string().trim().min(1).optional()
});

const storageEnvSchema = z.object({
  SUPABASE_URL: z.string().trim().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().trim().min(1)
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type AuthEnv = {
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
};
export type AIEnv = {
  AI_INGESTION_TOKEN: string;
};
export type StorageEnv = z.infer<typeof storageEnvSchema>;

let cachedBaseEnv: BaseEnv | null = null;
let cachedAuthEnv: AuthEnv | null = null;
let cachedAIEnv: AIEnv | null = null;
let cachedStorageEnv: StorageEnv | null = null;

function parseWithSchema<T extends z.ZodTypeAny>(schema: T, scope: string): z.infer<T> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const missing = Object.entries(parsed.error.flatten().fieldErrors)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([field]) => field);

    throw new Error(`Variaveis de ambiente invalidas (${scope}): ${missing.join(", ")}`);
  }

  return parsed.data;
}

export function getBaseEnv(): BaseEnv {
  if (cachedBaseEnv) return cachedBaseEnv;
  cachedBaseEnv = parseWithSchema(baseEnvSchema, "base");
  return cachedBaseEnv;
}

export function getAuthEnv(): AuthEnv {
  if (cachedAuthEnv) return cachedAuthEnv;
  const parsed = parseWithSchema(authEnvSchema, "auth");
  cachedAuthEnv = {
    ...parsed,
    NEXTAUTH_SECRET: parsed.NEXTAUTH_SECRET ?? "dev-only-insecure-secret-change-before-production"
  };
  return cachedAuthEnv;
}

export function getAIEnv(): AIEnv {
  if (cachedAIEnv) return cachedAIEnv;
  const parsed = parseWithSchema(aiEnvSchema, "ai");
  cachedAIEnv = {
    ...parsed,
    AI_INGESTION_TOKEN: parsed.AI_INGESTION_TOKEN ?? ""
  };
  return cachedAIEnv;
}

export function getStorageEnv(): StorageEnv {
  if (cachedStorageEnv) return cachedStorageEnv;
  cachedStorageEnv = parseWithSchema(storageEnvSchema, "storage");
  return cachedStorageEnv;
}
