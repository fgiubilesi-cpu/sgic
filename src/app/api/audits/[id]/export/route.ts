import { NextRequest, NextResponse } from "next/server";
import { generateAuditExcel } from "@/features/audits/actions/export-actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await generateAuditExcel(id);

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
