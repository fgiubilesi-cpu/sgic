import { redirect } from "next/navigation";

import { MyDayBoard } from "@/features/my-day/components/my-day-board";
import { getMyDayPayload } from "@/features/my-day/queries/get-my-day";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Day - SGIC",
  description: "Agenda operativa unica per task, scadenze, audit e documenti da validare.",
};

export default async function MyDayPage() {
  const payload = await getMyDayPayload();

  if (!payload) {
    redirect("/login");
  }

  return <MyDayBoard agenda={payload.agenda} role={payload.role} />;
}
