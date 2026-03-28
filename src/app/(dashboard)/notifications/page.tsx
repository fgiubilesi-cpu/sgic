import { redirect } from "next/navigation";
import { NotificationCenterShell } from "@/features/notifications/components/notification-center-shell";
import { getNotificationCenter } from "@/features/notifications/queries/get-notification-center";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const center = await getNotificationCenter();

  if (!center) {
    redirect("/my-day");
  }

  return <NotificationCenterShell center={center} />;
}
