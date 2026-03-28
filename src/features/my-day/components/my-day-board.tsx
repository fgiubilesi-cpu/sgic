import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileText,
  ListTodo,
  PauseCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateLabel } from "@/features/dashboard/lib/dashboard-data-utils";
import type {
  MyDayAgenda,
  MyDayItem,
  MyDaySection,
} from "@/features/my-day/lib/my-day";

const SECTION_COPY: Record<
  MyDaySection,
  {
    description: string;
    empty: string;
    title: string;
  }
> = {
  blocked: {
    description: "Attività ferme che richiedono sblocco o riallineamento.",
    empty: "Nessun blocco attivo.",
    title: "Da sbloccare",
  },
  overdue: {
    description: "Tutto ciò che è già fuori finestra operativa.",
    empty: "Nessun elemento in ritardo.",
    title: "In ritardo",
  },
  review: {
    description: "Documenti che richiedono validazione o retry di acquisizione.",
    empty: "Nessun documento da validare.",
    title: "Da validare",
  },
  this_week: {
    description: "Lavoro da presidiare entro la settimana corrente.",
    empty: "Nessuna pressione ulteriore questa settimana.",
    title: "Questa settimana",
  },
  today: {
    description: "Le priorità da chiudere o presidiare oggi.",
    empty: "Nessuna scadenza o attività per oggi.",
    title: "Oggi",
  },
};

function toneClasses(tone: MyDayItem["tone"]) {
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function SummaryCard(props: {
  description: string;
  href: string;
  title: string;
  tone: MyDayItem["tone"];
  value: number;
}) {
  return (
    <Link href={props.href} className="block">
      <Card className="h-full gap-0 border-zinc-200 py-0 transition-colors hover:border-zinc-300">
        <CardHeader className="gap-1 px-5 py-4">
          <CardDescription>{props.title}</CardDescription>
          <CardTitle className="text-2xl font-semibold text-zinc-900">
            {props.value}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <Badge variant="outline" className={toneClasses(props.tone)}>
            {props.description}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

function AgendaItemRow({ item }: { item: MyDayItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900">{item.title}</p>
          <Badge variant="outline" className={toneClasses(item.tone)}>
            {item.badge}
          </Badge>
        </div>
        <p className="text-sm text-zinc-600">{item.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          {item.context ? <span>{item.context}</span> : null}
          {item.dueDate ? <span>Scadenza {formatDateLabel(item.dueDate)}</span> : null}
        </div>
      </div>
      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />
    </Link>
  );
}

function AgendaSection(props: {
  items: MyDayItem[];
  section: MyDaySection;
}) {
  const copy = SECTION_COPY[props.section];

  return (
    <Card className="gap-0 border-zinc-200 py-0">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base text-zinc-900">{copy.title}</CardTitle>
            <CardDescription className="mt-1">{copy.description}</CardDescription>
          </div>
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
            {props.items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-4">
        {props.items.length === 0 ? (
          <p className="text-sm text-zinc-500">{copy.empty}</p>
        ) : (
          props.items.map((item) => <AgendaItemRow key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  );
}

export function MyDayBoard({
  agenda,
  role,
}: {
  agenda: MyDayAgenda;
  role: "admin" | "client" | "inspector" | null;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-zinc-400" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Day</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Agenda operativa unica per task, scadenze, audit imminenti e documenti da validare.
            {role === "client"
              ? " Vista filtrata sul cliente associato all'utente."
              : " Vista personale/team per partire dal lavoro vero, non dai report."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/documents">
              <FileText />
              Documenti
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/non-conformities">
              <AlertTriangle />
              Non conformità
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/deadlines">
              <Clock3 />
              Scadenze
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          description="Da presidiare oggi"
          href="#today"
          title="Oggi"
          tone={agenda.summary.today > 0 ? "warning" : "default"}
          value={agenda.summary.today}
        />
        <SummaryCard
          description="Fuori finestra"
          href="#overdue"
          title="In ritardo"
          tone={agenda.summary.overdue > 0 ? "danger" : "default"}
          value={agenda.summary.overdue}
        />
        <SummaryCard
          description="Documenti in review"
          href="#review"
          title="Da validare"
          tone={agenda.summary.review > 0 ? "warning" : "default"}
          value={agenda.summary.review}
        />
        <SummaryCard
          description="Pressione residua"
          href="#this-week"
          title="Questa settimana"
          tone={agenda.summary.thisWeek > 0 ? "warning" : "default"}
          value={agenda.summary.thisWeek}
        />
        <SummaryCard
          description={
            agenda.summary.blocked > 0
              ? `${agenda.summary.critical} segnali critici`
              : "Nessun fermo attivo"
          }
          href="#blocked"
          title="Da sbloccare"
          tone={agenda.summary.blocked > 0 ? "danger" : "default"}
          value={agenda.summary.blocked}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div id="overdue">
          <AgendaSection items={agenda.sections.overdue} section="overdue" />
        </div>
        <div id="today">
          <AgendaSection items={agenda.sections.today} section="today" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div id="review">
          <AgendaSection items={agenda.sections.review} section="review" />
        </div>
        <div id="blocked">
          <AgendaSection items={agenda.sections.blocked} section="blocked" />
        </div>
      </div>

      <div id="this-week">
        <AgendaSection items={agenda.sections.this_week} section="this_week" />
      </div>

      <Card className="gap-0 border-zinc-200 py-0">
        <CardHeader className="border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-zinc-400" />
            <div>
              <CardTitle className="text-base text-zinc-900">Regola di lettura</CardTitle>
              <CardDescription className="mt-1">
                Questa pagina serve a partire dal lavoro. I dettagli completi restano dentro i moduli.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-4 text-sm text-zinc-600">
          Se un elemento appare qui, deve sempre offrire un deep link utile e una ragione chiara
          per cui merita attenzione oggi.
        </CardContent>
      </Card>
    </div>
  );
}
