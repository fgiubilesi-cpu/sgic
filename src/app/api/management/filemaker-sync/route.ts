import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ingestFileMakerManagementSync } from "@/features/management/lib/filemaker-sync";

function getProvidedSecret(request: NextRequest) {
  const bearer = request.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }

  return request.headers.get("x-sgic-sync-key")?.trim() ?? "";
}

function isAuthorized(request: NextRequest) {
  const configuredSecret =
    process.env.MANAGEMENT_SYNC_API_KEY ?? process.env.INTERNAL_API_KEY ?? "";

  if (!configuredSecret) {
    throw new Error(
      "MANAGEMENT_SYNC_API_KEY or INTERNAL_API_KEY must be configured for management sync."
    );
  }

  const providedSecret = getProvidedSecret(request);
  return providedSecret.length > 0 && providedSecret === configuredSecret;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await ingestFileMakerManagementSync(payload);

    return NextResponse.json(
      {
        ok: true,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid sync payload",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected sync failure",
      },
      { status: 500 }
    );
  }
}
