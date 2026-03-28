"use client";

import { useState, useTransition } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrganizationMemberAccess } from "@/features/organization/actions/access-actions";
import { cn } from "@/lib/utils";
import type { OrganizationAccessOverview } from "@/features/organization/queries/get-organization-access";

type MemberRowProps = {
  canManageAccess: boolean;
  clients: OrganizationAccessOverview["clients"];
  currentUserId: string;
  member: OrganizationAccessOverview["members"][number];
};

const roleMeta: Record<string, { badgeClassName: string; label: string }> = {
  admin: {
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    label: "Admin",
  },
  client: {
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    label: "Cliente",
  },
  inspector: {
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "Ispettore",
  },
};

function MemberRow({ canManageAccess, clients, currentUserId, member }: MemberRowProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(member.role ?? "inspector");
  const [clientId, setClientId] = useState(member.clientId ?? "__none__");
  const isCurrentUser = member.id === currentUserId;

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrganizationMemberAccess({
        clientId: role === "client" ? (clientId === "__none__" ? null : clientId) : null,
        profileId: member.id,
        role: role as "admin" | "inspector" | "client",
      });

      if (result.error) {
        toast.error("Accesso non aggiornato", { description: result.error });
        return;
      }

      toast.success("Accesso aggiornato", { description: result.success });
    });
  }

  const roleLabel = roleMeta[member.role ?? "inspector"] ?? roleMeta.inspector;

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-0.5">
          <p className="font-medium text-zinc-900">{member.fullName || "Utente senza nome"}</p>
          <p className="text-xs text-zinc-500">{member.email || "Email non disponibile"}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn("border", roleLabel.badgeClassName)}>{roleLabel.label}</Badge>
      </TableCell>
      <TableCell className="text-sm text-zinc-600">
        {member.clientName || "Tutta l'organizzazione"}
      </TableCell>
      <TableCell>
        {canManageAccess ? (
          <div className="grid gap-2 md:grid-cols-[140px_1fr_auto]">
            <Select disabled={isPending || isCurrentUser} onValueChange={setRole} value={role}>
              <SelectTrigger>
                <SelectValue placeholder="Ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="inspector">Ispettore</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>

            <Select
              disabled={isPending || isCurrentUser || role !== "client"}
              onValueChange={setClientId}
              value={role === "client" ? clientId : "__none__"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cliente associato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nessun cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              disabled={isPending || isCurrentUser}
              onClick={handleSave}
              size="sm"
              variant="outline"
            >
              {isPending ? "Salvo..." : "Salva"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Solo gli admin possono modificare questa sezione.</p>
        )}
      </TableCell>
    </TableRow>
  );
}

export function OrganizationAccessPanel({
  overview,
}: {
  overview: OrganizationAccessOverview;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Accessi e ruoli</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-500">
              Gestisci i profili gia presenti nell&apos;organizzazione. Gli inviti utente non sono ancora integrati nel prodotto.
            </CardDescription>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {overview.roleSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-900">Guard-rail attivi</p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              <li>Non puoi modificare il tuo stesso ruolo da questa schermata.</li>
              <li>Gli utenti cliente devono essere associati a un cliente.</li>
              <li>Admin e ispettori operano su tutta l&apos;organizzazione.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-900">Perimetro accessi</p>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Il ruolo <span className="font-medium text-zinc-700">cliente</span> limita l&apos;esperienza al cliente associato. Dashboard e audit continuano a rispettare questo perimetro.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Ruolo attuale</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Gestione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.members.map((member) => (
                <MemberRow
                  key={member.id}
                  canManageAccess={overview.canManageAccess}
                  clients={overview.clients}
                  currentUserId={overview.currentUserId}
                  member={member}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {!overview.canManageAccess ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Questa sezione e visibile in sola lettura. Serve un ruolo admin per modificare ruoli e perimetro cliente.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
