import { timingSafeEqual } from "node:crypto";

import { getAIEnv } from "@/lib/env";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function getAIIngestionToken() {
  return getAIEnv().AI_INGESTION_TOKEN.trim() || null;
}

export function isAuthorizedAIIngestionRequest(request: Request) {
  const expectedToken = getAIIngestionToken();
  const receivedToken = getBearerToken(request);

  if (!expectedToken || !receivedToken) {
    return false;
  }

  return safeEqual(expectedToken, receivedToken);
}
