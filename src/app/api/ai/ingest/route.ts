import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isAuthorizedAIIngestionRequest } from "@/lib/ai/http-auth";
import { parseAIIngestionRequestBody } from "@/lib/ai/request";
import { EditorialAIIngestionService } from "@/lib/ai/workflow";

const ingestionService = new EditorialAIIngestionService();

export async function POST(request: Request) {
  if (!isAuthorizedAIIngestionRequest(request)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Bearer token invalido para ingestao de IA."
      },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "invalid_json",
        message: "O corpo da requisicao precisa ser JSON valido."
      },
      { status: 400 }
    );
  }

  try {
    const payload = parseAIIngestionRequestBody(body);
    const result = await ingestionService.ingest(payload);

    return NextResponse.json(
      {
        ok: true,
        jobId: result.jobId,
        draftIds: result.draftIds
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Payload de ingestao invalido.",
          issues: error.flatten()
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: "ingestion_failed",
        message: "Nao foi possivel persistir a ingestao externa."
      },
      { status: 500 }
    );
  }
}
