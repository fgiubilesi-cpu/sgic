import Link from "next/link";
import { ArrowRight, BellRing, Mail, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SendDeadlinesButton } from "@/features/email/components/send-deadlines-button";
import { SendOverdueACButton } from "@/features/email/components/send-overdue-ac-button";
import type {
  NotificationCenterItem,
  NotificationCenterModel,
  NotificationDispatchRecord,
} from "@/features/notifications/lib/notification-center";

const severityClasses = {
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  default: "border-zinc-200 bg-zinc-50 text-zinc-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const statusClasses = {
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  skipped: "border-zinc-200 bg-zinc-50 text-zinc-700",
  suppressed: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getAudienceLabel(audience: NotificationCenterModel["preferences"]["audience"]) {
  return audience === "admins" ? "Solo admin" : "Admin + inspector";
}

function getChannelLabel(
  deliveryChannel: NotificationCenterModel["preferences"]["deliveryChannel"]
) {
  return deliveryChannel === "dashboard_email"
    ? "Dashboard + email"
    : "Solo dashboard";
}

function getDigestLabel(
  digestFrequency: NotificationCenterModel["preferences"]["digestFrequency"]
) {
  if (digestFrequency === "off") return "Off";
  return digestFrequency === "daily" ? "Daily" : "Weekly";
}

function PendingAction({ item }: { item: NotificationCenterItem }) {
  if (item.sendAction === "deadlines_summary") {
    return <SendDeadlinesButton />;
  }

  if (item.sendAction === "overdue_corrective_actions") {
    return <SendOverdueACButton />;
  }

  return null;
}

function PendingCard({
  item,
  preferences,
}: {
  item: NotificationCenterItem;
  preferences: NotificationCenterModel["preferences"];
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-zinc-900">
              {item.label}
            </CardTitle>
            <CardDescription className="mt-1">
              {item.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className={severityClasses[item.severity]}>
            {item.count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Audience</p>
            <p className="mt-1 font-medium text-zinc-900">
              {getAudienceLabel(preferences.audience)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Canale</p>
            <p className="mt-1 font-medium text-zinc-900">
              {getChannelLabel(preferences.deliveryChannel)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Digest</p>
            <p className="mt-1 font-medium text-zinc-900">
              {getDigestLabel(preferences.digestFrequency)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PendingAction item={item} />
          <Link
            href={item.href}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Apri vista operativa
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SilencedCard({ item }: { item: NotificationCenterItem }) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-zinc-900">
              {item.label}
            </CardTitle>
            <CardDescription className="mt-1">{item.reason}</CardDescription>
          </div>
          <Badge variant="outline" className={severityClasses[item.severity]}>
            {item.count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 text-sm text-zinc-600">
        <span>{item.description}</span>
        <Link
          href="/organization?tab=notifications"
          className="inline-flex items-center gap-2 font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          Rivedi policy
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function DispatchRow({ dispatch }: { dispatch: NotificationDispatchRecord }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-900">{dispatch.title}</p>
          <Badge variant="outline" className={statusClasses[dispatch.status]}>
            {dispatch.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {dispatch.recipient
            ? `${dispatch.recipient} · ${dispatch.type}`
            : dispatch.type}
        </p>
        {dispatch.details ? (
          <p className="mt-1 text-xs text-zinc-500">{dispatch.details}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Mail className="h-4 w-4" />
        {formatDateTime(dispatch.createdAt)}
      </div>
    </div>
  );
}

export function NotificationCenterShell({
  center,
}: {
  center: NotificationCenterModel;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-zinc-500" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Notification Center
          </h1>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Unifica trigger attivi, segnali silenziati e storico degli invii operativi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Trigger attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {center.summary.active}
            </div>
            <p className="mt-1 text-sm text-zinc-500">Categorie in coda operativa</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Pressione totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {center.summary.pendingCount}
            </div>
            <p className="mt-1 text-sm text-zinc-500">Elementi in attesa di presidio</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Silenziate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {center.summary.silenced}
            </div>
            <p className="mt-1 text-sm text-zinc-500">Trigger esclusi da policy o soglia</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Invii recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {center.summary.recentSent}
            </div>
            <p className="mt-1 text-sm text-zinc-500">Dispatch tracciati nello storico</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Policy attiva</CardTitle>
          <CardDescription>
            Queste preferenze governano come i segnali vengono resi visibili o silenziati.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Audience</p>
            <p className="mt-1 font-medium text-zinc-900">
              {getAudienceLabel(center.preferences.audience)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Canale</p>
            <p className="mt-1 font-medium text-zinc-900">
              {getChannelLabel(center.preferences.deliveryChannel)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Digest</p>
            <p className="mt-1 font-medium text-zinc-900">
              {getDigestLabel(center.preferences.digestFrequency)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Destinatari</p>
            <p className="mt-1 font-medium text-zinc-900">
              {center.preferences.recipientsCount}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Da inviare o presidiare</h2>
        </div>
        {center.active.length === 0 ? (
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="py-6 text-sm text-zinc-500">
              Nessun trigger attivo sopra soglia nel perimetro corrente.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {center.active.map((item) => (
              <PendingCard
                key={item.key}
                item={item}
                preferences={center.preferences}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Silenziate</h2>
        </div>
        {center.silenced.length === 0 ? (
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="py-6 text-sm text-zinc-500">
              Nessun trigger silenziato con pressione reale nel tenant.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {center.silenced.map((item) => (
              <SilencedCard key={item.key} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Storico invii</h2>
        </div>
        {center.recent.length === 0 ? (
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="py-6 text-sm text-zinc-500">
              Nessun invio tracciato finora. I nuovi dispatch verranno registrati qui.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {center.recent.map((dispatch) => (
              <DispatchRow key={dispatch.id} dispatch={dispatch} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
