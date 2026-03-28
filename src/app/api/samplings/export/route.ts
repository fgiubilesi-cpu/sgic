import { NextRequest, NextResponse } from "next/server";
import { generateSamplingsExcel } from "@/features/samplings/actions/export-samplings-action";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;

  const result = await generateSamplingsExcel(clientId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const buffer = Buffer.from(result.base64, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
