type SmokeCheck = {
  name: string;
  run: () => Promise<{ ok: boolean; details: string }>;
};

const baseUrl = (process.argv[2] ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function checkPublicLogin(): Promise<{ ok: boolean; details: string }> {
  const response = await fetch(`${baseUrl}/login`, { redirect: "manual" });
  const ok = response.status === 200;

  return {
    ok,
    details: `GET /login -> ${response.status}`
  };
}

async function checkAdminGuard(): Promise<{ ok: boolean; details: string }> {
  const response = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  const redirectedToLogin = location.includes("/login");
  const ok = (response.status === 302 || response.status === 307) && redirectedToLogin;

  return {
    ok,
    details: `GET /admin -> ${response.status} (${location || "sem location"})`
  };
}

async function checkAIIngestGuard(): Promise<{ ok: boolean; details: string }> {
  const response = await fetch(`${baseUrl}/api/ai/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ drafts: [] }),
    redirect: "manual"
  });
  const ok = response.status === 401;

  return {
    ok,
    details: `POST /api/ai/ingest sem token -> ${response.status}`
  };
}

const checks: SmokeCheck[] = [
  { name: "login-page", run: checkPublicLogin },
  { name: "admin-guard", run: checkAdminGuard },
  { name: "ai-ingest-guard", run: checkAIIngestGuard }
];

async function main() {
  console.log(`Smoke check target: ${baseUrl}`);

  let failed = 0;

  for (const check of checks) {
    try {
      const result = await check.run();
      const mark = result.ok ? "OK" : "FAIL";
      console.log(`[${mark}] ${check.name} - ${result.details}`);
      if (!result.ok) failed += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "erro desconhecido";
      console.log(`[FAIL] ${check.name} - ${message}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main();

