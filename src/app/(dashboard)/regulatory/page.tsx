import { redirect } from "next/navigation";
import { RegulatoryBridgeShell } from "@/features/regulatory/components/regulatory-bridge-shell";
import { getRegulatoryBridge } from "@/features/regulatory/queries/get-regulatory-bridge";

export const dynamic = "force-dynamic";

export default async function RegulatoryPage() {
  const bridge = await getRegulatoryBridge();

  if (!bridge) {
    redirect("/my-day");
  }

  return <RegulatoryBridgeShell bridge={bridge} />;
}
